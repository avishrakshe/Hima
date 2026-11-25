//! # frost-wasm
//!
//! WebAssembly bindings for Hima over the Zcash Foundation's
//! re-randomized FROST(Pallas, BLAKE2b-512) ciphersuite (`reddsa` + `frost-core` 3).
//!
//! The JS-facing functions take and return JSON strings. Protocol objects are
//! hex-encoded frost-core serializations, and participants are keyed by index (1..=n).
//! The typed logic lives in [`protocol`] and is tested natively with `cargo test`.
//!
//! **Unaudited. For education only. Never use keys from this library for real funds.**

pub mod protocol;

use std::collections::BTreeMap;

use serde::Serialize;
use wasm_bindgen::prelude::*;

type Map = BTreeMap<u16, String>;

fn to_js<T: Serialize>(r: protocol::Result<T>) -> Result<String, JsError> {
    let value = r.map_err(|e| JsError::new(&e.to_string()))?;
    serde_json::to_string(&value).map_err(|e| JsError::new(&e.to_string()))
}

fn map(json: &str) -> Result<Map, JsError> {
    serde_json::from_str(json).map_err(|e| JsError::new(&format!("expected {{index: hex}} JSON: {e}")))
}

fn bytes(hex_str: &str) -> Result<Vec<u8>, JsError> {
    hex::decode(hex_str).map_err(|e| JsError::new(&format!("message hex: {e}")))
}

/// Library + ciphersuite identification, shown in the game's "about" panel.
#[wasm_bindgen]
pub fn version() -> String {
    format!(
        "frost-wasm {} | FROST(Pallas, BLAKE2b-512) re-randomized | reddsa 0.5.2 | frost-core 3.0.0",
        env!("CARGO_PKG_VERSION")
    )
}

/// DKG part 1. Returns `{secret, package}`.
#[wasm_bindgen(js_name = dkgPart1)]
pub fn dkg_part1(index: u16, max_signers: u16, min_signers: u16) -> Result<String, JsError> {
    to_js(protocol::dkg_part1(index, max_signers, min_signers))
}

/// DKG part 2. `round1_packages`: JSON `{index: hex}` of the *other* players. Returns `{secret, packages}`.
#[wasm_bindgen(js_name = dkgPart2)]
pub fn dkg_part2(secret: &str, round1_packages: &str) -> Result<String, JsError> {
    to_js(protocol::dkg_part2(secret, &map(round1_packages)?))
}

/// DKG part 3. Returns `{key_package, public_key_package, group_key}`.
#[wasm_bindgen(js_name = dkgPart3)]
pub fn dkg_part3(
    round2_secret: &str,
    round1_packages: &str,
    round2_packages: &str,
) -> Result<String, JsError> {
    to_js(protocol::dkg_part3(
        round2_secret,
        &map(round1_packages)?,
        &map(round2_packages)?,
    ))
}

/// Signing round 1. Returns `{nonces, commitments}`.
#[wasm_bindgen(js_name = signCommit)]
pub fn sign_commit(key_package: &str) -> Result<String, JsError> {
    to_js(protocol::sign_commit(key_package))
}

/// Coordinator. `commitments`: JSON `{index: hex}`; `message_hex`: the bytes to sign.
/// Returns `{signing_package, randomizer_seed, randomized_key}`.
#[wasm_bindgen(js_name = newSigningRound)]
pub fn new_signing_round(
    commitments: &str,
    message_hex: &str,
    public_key_package: &str,
) -> Result<String, JsError> {
    to_js(protocol::new_signing_round(
        &map(commitments)?,
        &bytes(message_hex)?,
        public_key_package,
    ))
}

/// Signing round 2. Returns the signature share as a JSON string (hex).
#[wasm_bindgen(js_name = signShare)]
pub fn sign_share(
    signing_package: &str,
    nonces: &str,
    key_package: &str,
    randomizer_seed: &str,
) -> Result<String, JsError> {
    to_js(protocol::sign_share(signing_package, nonces, key_package, randomizer_seed))
}

/// Level 2: a deliberately invalid share (signs a different message). Labelled "simulated cheater" in the UI.
#[wasm_bindgen(js_name = signShareCheating)]
pub fn sign_share_cheating(
    signing_package: &str,
    nonces: &str,
    key_package: &str,
    randomizer_seed: &str,
) -> Result<String, JsError> {
    to_js(protocol::sign_share_cheating(
        signing_package,
        nonces,
        key_package,
        randomizer_seed,
    ))
}

/// Coordinator. `shares`: JSON `{index: hex}`. Returns `{ok, signature, randomized_key, culprits, error}`.
#[wasm_bindgen]
pub fn aggregate(
    signing_package: &str,
    shares: &str,
    public_key_package: &str,
    randomizer_seed: &str,
) -> Result<String, JsError> {
    to_js(protocol::aggregate(
        signing_package,
        &map(shares)?,
        public_key_package,
        randomizer_seed,
    ))
}

/// Verify a signature under any RedPallas verifying key. Returns `true`/`false`.
#[wasm_bindgen]
pub fn verify(verifying_key: &str, message_hex: &str, signature: &str) -> Result<bool, JsError> {
    protocol::verify(verifying_key, &bytes(message_hex)?, signature)
        .map_err(|e| JsError::new(&e.to_string()))
}

/// Runs the whole game (DKG, two re-randomized signatures, one cheater) in one call.
#[wasm_bindgen(js_name = selfTest)]
pub fn self_test(n: u16, t: u16) -> Result<String, JsError> {
    to_js(protocol::self_test(n, t))
}
