use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use rand::RngCore;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;

const APP_SALT: &[u8] = b"itervia-desktop-encryption-salt-v1";

fn get_key_file_path() -> PathBuf {
    let data_dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    data_dir.join("itervia").join(".secret_key")
}

fn get_or_create_key() -> [u8; 32] {
    let key_path = get_key_file_path();

    if let Ok(key_bytes) = fs::read(&key_path) {
        if key_bytes.len() == 32 {
            let mut key = [0u8; 32];
            key.copy_from_slice(&key_bytes);
            return key;
        }
    }

    // Derive key from machine hostname + salt
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().into_owned())
        .unwrap_or_else(|_| "unknown-host".to_string());

    let mut hasher = Sha256::new();
    hasher.update(APP_SALT);
    hasher.update(hostname.as_bytes());
    let hash = hasher.finalize();

    let mut key = [0u8; 32];
    key.copy_from_slice(&hash);

    // Store key for next time
    let _ = fs::create_dir_all(key_path.parent().unwrap());
    let _ = fs::write(&key_path, key);

    key
}

pub fn encrypt(plaintext: &str) -> Result<String, String> {
    let key = get_or_create_key();
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| e.to_string())?;

    // Store nonce + ciphertext together
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);

    Ok(B64.encode(&combined))
}

pub fn decrypt(encoded: &str) -> Result<String, String> {
    let key = get_or_create_key();
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;

    let combined = B64.decode(encoded).map_err(|e| e.to_string())?;

    if combined.len() < 12 {
        return Err("Invalid encrypted data".to_string());
    }

    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| e.to_string())?;

    String::from_utf8(plaintext).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let plaintext = "my-secret-api-key-12345";
        let encrypted = encrypt(plaintext).unwrap();
        let decrypted = decrypt(&encrypted).unwrap();
        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_encrypt_produces_different_ciphertext() {
        let plaintext = "same-key";
        let e1 = encrypt(plaintext).unwrap();
        let e2 = encrypt(plaintext).unwrap();
        // Nonce is random, so ciphertexts differ
        assert_ne!(e1, e2);
        // But both decrypt to the same value
        assert_eq!(decrypt(&e1).unwrap(), plaintext);
        assert_eq!(decrypt(&e2).unwrap(), plaintext);
    }

    #[test]
    fn test_decrypt_invalid_data() {
        assert!(decrypt("not-valid-base64!!!").is_err());
    }

    #[test]
    fn test_decrypt_too_short() {
        let short = B64.encode(&[0u8; 5]);
        assert!(decrypt(&short).is_err());
    }
}
