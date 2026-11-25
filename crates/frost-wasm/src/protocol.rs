//! The Hima protocol layer: thin, typed wrappers over the Zcash
//! Foundation's re-randomized FROST(Pallas, BLAKE2b-512) ciphersuite.
//!
//! Every function here is *stateless*. Protocol objects cross the boundary as
//! hex-encoded bytes produced by frost-core's own serialization, so the
//! browser can hold them as opaque strings and ship the public ones over the
//! relay. Participants are addressed by a small integer index (1..=n), which
//! maps 1:1 to a FROST `Identifier`.
//!
//! SECURITY: unaudited demo code. Secret values (DKG secret packages, signing
//! nonces, key packages) are returned to the caller as hex so the game can keep
//! them in tab memory. They must never be sent over the network, and signing
//! nonces must never be reused: the caller deletes them after `sign_share`.

use std::collections::BTreeMap;
use std::fmt;

use rand_core::OsRng;
use reddsa::frost::redpallas as frost;
use serde::{Deserialize, Serialize};

use frost::keys::dkg;
use frost::rerandomized::RandomizedParams;

/// What a cheating player signs instead of the agreed message.
const CHEAT_MESSAGE: &[u8] = b"Hima: a message nobody agreed to";

/* ---------------------------------------------------------------------- */
/* Errors and encoding helpers                                            */
/* ---------------------------------------------------------------------- */

#[derive(Debug)]
pub enum HimaError {
    Frost(frost::Error),
    Hex(hex::FromHexError),
    Invalid(String),
}

impl fmt::Display for HimaError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Frost(e) => write!(f, "frost: {e}"),
            Self::Hex(e) => write!(f, "hex: {e}"),
            Self::Invalid(msg) => write!(f, "invalid input: {msg}"),
        }
    }
}

impl std::error::Error for HimaError {}

impl From<frost::Error> for HimaError {
    fn from(e: frost::Error) -> Self {
        Self::Frost(e)
    }
}

impl From<hex::FromHexError> for HimaError {
    fn from(e: hex::FromHexError) -> Self {
        Self::Hex(e)
    }
}

pub type Result<T> = std::result::Result<T, HimaError>;

fn enc(bytes: impl AsRef<[u8]>) -> String {
    hex::encode(bytes)
}

fn dec(s: &str) -> Result<Vec<u8>> {
    Ok(hex::decode(s)?)
}

/// Participant index (1..=n) -> FROST identifier.
fn id(index: u16) -> Result<frost::Identifier> {
    frost::Identifier::try_from(index)
        .map_err(|_| HimaError::Invalid(format!("participant index {index} must be >= 1")))
}

/// Decode a `{index: hex}` map into `{Identifier: T}`.
fn decode_map<T>(
    map: &BTreeMap<u16, String>,
    parse: impl Fn(&[u8]) -> std::result::Result<T, frost::Error>,
) -> Result<BTreeMap<frost::Identifier, T>> {
    map.iter()
        .map(|(index, hex)| Ok((id(*index)?, parse(&dec(hex)?)?)))
        .collect()
}

/// Map FROST identifiers back to participant indices, using the indices the
/// caller already gave us as the universe of possible participants.
fn indices_of(ids: &[frost::Identifier], universe: impl Iterator<Item = u16>) -> Vec<u16> {
    universe
        .filter(|i| id(*i).map(|x| ids.contains(&x)).unwrap_or(false))
        .collect()
}

/* ---------------------------------------------------------------------- */
/* Level 1: distributed key generation                                    */
/* ---------------------------------------------------------------------- */

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DkgRound1 {
    /// Kept on this phone. Never sent.
    pub secret: String,
    /// Broadcast to every other participant.
    pub package: String,
}

/// DKG part 1: pick a secret polynomial, publish commitments plus a proof of knowledge.
pub fn dkg_part1(index: u16, max_signers: u16, min_signers: u16) -> Result<DkgRound1> {
    let (secret, package) = dkg::part1(id(index)?, max_signers, min_signers, OsRng)?;
    Ok(DkgRound1 {
        secret: enc(secret.serialize()?),
        package: enc(package.serialize()?),
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DkgRound2 {
    /// Kept on this phone. Never sent.
    pub secret: String,
    /// One package per recipient index. Each must reach only its recipient
    /// (the game encrypts these before they touch the relay).
    pub packages: BTreeMap<u16, String>,
}

/// DKG part 2: verify everyone's round-1 proofs and compute a secret share for each peer.
/// `round1_packages` holds the *other* participants' round-1 packages, keyed by index.
pub fn dkg_part2(secret: &str, round1_packages: &BTreeMap<u16, String>) -> Result<DkgRound2> {
    let secret = dkg::round1::SecretPackage::deserialize(&dec(secret)?)?;
    let received = decode_map(round1_packages, dkg::round1::Package::deserialize)?;
    let (secret, outgoing) = dkg::part2(secret, &received)?;

    let mut packages = BTreeMap::new();
    for index in round1_packages.keys() {
        let pkg = outgoing
            .get(&id(*index)?)
            .ok_or_else(|| HimaError::Invalid(format!("no round-2 package for {index}")))?;
        packages.insert(*index, enc(pkg.serialize()?));
    }

    Ok(DkgRound2 {
        secret: enc(secret.serialize()?),
        packages,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DkgResult {
    /// This participant's long-lived key share. Kept on this phone.
    pub key_package: String,
    /// Public: every participant's verifying share plus the group key.
    pub public_key_package: String,
    /// The group verifying key, the key "nobody holds".
    pub group_key: String,
}

/// DKG part 3: verify the shares sent to us and derive our key share and the group key.
pub fn dkg_part3(
    round2_secret: &str,
    round1_packages: &BTreeMap<u16, String>,
    round2_packages: &BTreeMap<u16, String>,
) -> Result<DkgResult> {
    let secret = dkg::round2::SecretPackage::deserialize(&dec(round2_secret)?)?;
    let r1 = decode_map(round1_packages, dkg::round1::Package::deserialize)?;
    let r2 = decode_map(round2_packages, dkg::round2::Package::deserialize)?;
    let (key_package, public_key_package) = dkg::part3(&secret, &r1, &r2)?;
    Ok(DkgResult {
        key_package: enc(key_package.serialize()?),
        group_key: enc(public_key_package.verifying_key().serialize()?),
        public_key_package: enc(public_key_package.serialize()?),
    })
}

/* ---------------------------------------------------------------------- */
/* Signing (re-randomized FROST)                                          */
/* ---------------------------------------------------------------------- */

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Commitment {
    /// Single-use secret nonces. Kept on this phone; delete after signing.
    pub nonces: String,
    /// Sent to the coordinator.
    pub commitments: String,
}

/// Signing round 1: generate fresh nonces and publish their commitments.
pub fn sign_commit(key_package: &str) -> Result<Commitment> {
    let key_package = frost::keys::KeyPackage::deserialize(&dec(key_package)?)?;
    let (nonces, commitments) = frost::round1::commit(key_package.signing_share(), &mut OsRng);
    Ok(Commitment {
        nonces: enc(nonces.serialize()?),
        commitments: enc(commitments.serialize()?),
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SigningRound {
    pub signing_package: String,
    /// Lets every signer re-derive the same randomizer, bound to these commitments.
    pub randomizer_seed: String,
    /// The fresh, randomized key this signature will verify under.
    pub randomized_key: String,
}

/// Coordinator: fix the message and signer set, and draw a fresh randomizer.
pub fn new_signing_round(
    commitments: &BTreeMap<u16, String>,
    message: &[u8],
    public_key_package: &str,
) -> Result<SigningRound> {
    let pkp = frost::keys::PublicKeyPackage::deserialize(&dec(public_key_package)?)?;
    let commitments = decode_map(commitments, frost::round1::SigningCommitments::deserialize)?;
    let signing_package = frost::SigningPackage::new(commitments, message);
    let (params, seed) = RandomizedParams::new_from_commitments(
        pkp.verifying_key(),
        signing_package.signing_commitments(),
        OsRng,
    )?;
    Ok(SigningRound {
        signing_package: enc(signing_package.serialize()?),
        randomizer_seed: enc(seed),
        randomized_key: enc(params.randomized_verifying_key().serialize()?),
    })
}

/// Signing round 2: produce this participant's signature share.
pub fn sign_share(
    signing_package: &str,
    nonces: &str,
    key_package: &str,
    randomizer_seed: &str,
) -> Result<String> {
    let signing_package = frost::SigningPackage::deserialize(&dec(signing_package)?)?;
    sign_over(&signing_package, nonces, key_package, randomizer_seed)
}

/// Level 2 only: a *cheating* signature share. The cheater signs a different
/// message than the one agreed in the signing package, using their real key and
/// real nonces. The share is well-formed but fails verification, which is
/// exactly what FROST's cheater detection catches.
pub fn sign_share_cheating(
    signing_package: &str,
    nonces: &str,
    key_package: &str,
    randomizer_seed: &str,
) -> Result<String> {
    let honest = frost::SigningPackage::deserialize(&dec(signing_package)?)?;
    let tampered = frost::SigningPackage::new(honest.signing_commitments().clone(), CHEAT_MESSAGE);
    sign_over(&tampered, nonces, key_package, randomizer_seed)
}

fn sign_over(
    signing_package: &frost::SigningPackage,
    nonces: &str,
    key_package: &str,
    randomizer_seed: &str,
) -> Result<String> {
    let nonces = frost::round1::SigningNonces::deserialize(&dec(nonces)?)?;
    let key_package = frost::keys::KeyPackage::deserialize(&dec(key_package)?)?;
    let share = frost::rerandomized::sign_with_randomizer_seed(
        signing_package,
        &nonces,
        &key_package,
        &dec(randomizer_seed)?,
    )?;
    Ok(enc(share.serialize()))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregateOutcome {
    pub ok: bool,
    /// Present when `ok`.
    pub signature: Option<String>,
    /// Present when `ok`: the randomized key the signature verifies under.
    pub randomized_key: Option<String>,
    /// Indices of participants whose signature shares were invalid.
    pub culprits: Vec<u16>,
    /// Human-readable failure reason when not `ok`.
    pub error: Option<String>,
}

/// Coordinator: verify every share and combine them. On failure, name every cheater.
pub fn aggregate(
    signing_package: &str,
    shares: &BTreeMap<u16, String>,
    public_key_package: &str,
    randomizer_seed: &str,
) -> Result<AggregateOutcome> {
    let signing_package = frost::SigningPackage::deserialize(&dec(signing_package)?)?;
    let pkp = frost::keys::PublicKeyPackage::deserialize(&dec(public_key_package)?)?;
    let share_map = decode_map(shares, frost::round2::SignatureShare::deserialize)?;
    let params = RandomizedParams::regenerate_from_seed_and_commitments(
        pkp.verifying_key(),
        &dec(randomizer_seed)?,
        signing_package.signing_commitments(),
    )?;

    match frost::rerandomized::aggregate_custom(
        &signing_package,
        &share_map,
        &pkp,
        frost::CheaterDetection::AllCheaters,
        &params,
    ) {
        Ok(signature) => Ok(AggregateOutcome {
            ok: true,
            signature: Some(enc(signature.serialize()?)),
            randomized_key: Some(enc(params.randomized_verifying_key().serialize()?)),
            culprits: vec![],
            error: None,
        }),
        Err(e) => Ok(AggregateOutcome {
            ok: false,
            signature: None,
            randomized_key: None,
            culprits: indices_of(&e.culprits(), shares.keys().copied()),
            error: Some(e.to_string()),
        }),
    }
}

/// Plain RedPallas verification of `signature` over `message` under `verifying_key`.
/// Level 4 uses it to show a signature verifies under its randomized key but not
/// under the group key.
pub fn verify(verifying_key: &str, message: &[u8], signature: &str) -> Result<bool> {
    let vk = frost::VerifyingKey::deserialize(&dec(verifying_key)?)?;
    let sig = frost::Signature::deserialize(&dec(signature)?)?;
    Ok(vk.verify(message, &sig).is_ok())
}

/* ---------------------------------------------------------------------- */
/* Self-test: the whole game in one call (hot-seat warm-up + CI)          */
/* ---------------------------------------------------------------------- */

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelfTestReport {
    pub participants: u16,
    pub threshold: u16,
    pub group_key: String,
    pub randomized_key_1: String,
    pub randomized_key_2: String,
    pub verifies_under_randomized_key: bool,
    pub verifies_under_group_key: bool,
    pub randomized_keys_differ: bool,
    pub cheater: u16,
    pub culprits_named: Vec<u16>,
}

/// Run a DKG among `n` players, two honest re-randomized signatures with the
/// first `t` players, and one signature where player 2 cheats.
pub fn self_test(n: u16, t: u16) -> Result<SelfTestReport> {
    if t < 2 || t > n {
        return Err(HimaError::Invalid(format!("need 2 <= t <= n, got t={t} n={n}")));
    }
    let players: Vec<u16> = (1..=n).collect();

    // DKG round 1
    let r1: BTreeMap<u16, DkgRound1> = players
        .iter()
        .map(|&i| Ok((i, dkg_part1(i, n, t)?)))
        .collect::<Result<_>>()?;
    let others_r1 = |me: u16| -> BTreeMap<u16, String> {
        r1.iter()
            .filter(|(i, _)| **i != me)
            .map(|(i, p)| (*i, p.package.clone()))
            .collect()
    };

    // DKG round 2
    let r2: BTreeMap<u16, DkgRound2> = players
        .iter()
        .map(|&i| Ok((i, dkg_part2(&r1[&i].secret, &others_r1(i))?)))
        .collect::<Result<_>>()?;

    // DKG round 3: collect the packages addressed to each player
    let mut results = BTreeMap::new();
    for &me in &players {
        let inbox: BTreeMap<u16, String> = r2
            .iter()
            .filter(|(from, _)| **from != me)
            .map(|(from, out)| (*from, out.packages[&me].clone()))
            .collect();
        results.insert(me, dkg_part3(&r2[&me].secret, &others_r1(me), &inbox)?);
    }
    let group_key = results[&1].group_key.clone();
    if results.values().any(|r| r.group_key != group_key) {
        return Err(HimaError::Invalid("players disagree on the group key".into()));
    }
    let pkp = results[&1].public_key_package.clone();
    let signers: Vec<u16> = players.iter().copied().take(t as usize).collect();
    let message = b"Hima demo message - not a transaction";

    let run = |cheater: Option<u16>| -> Result<(SigningRound, AggregateOutcome)> {
        let commits: BTreeMap<u16, Commitment> = signers
            .iter()
            .map(|&i| Ok((i, sign_commit(&results[&i].key_package)?)))
            .collect::<Result<_>>()?;
        let round = new_signing_round(
            &commits.iter().map(|(i, c)| (*i, c.commitments.clone())).collect(),
            message,
            &pkp,
        )?;
        let shares: BTreeMap<u16, String> = signers
            .iter()
            .map(|&i| {
                let f = if Some(i) == cheater { sign_share_cheating } else { sign_share };
                Ok((
                    i,
                    f(
                        &round.signing_package,
                        &commits[&i].nonces,
                        &results[&i].key_package,
                        &round.randomizer_seed,
                    )?,
                ))
            })
            .collect::<Result<_>>()?;
        let outcome = aggregate(&round.signing_package, &shares, &pkp, &round.randomizer_seed)?;
        Ok((round, outcome))
    };

    let (round1, sig1) = run(None)?;
    let (round2, sig2) = run(None)?;
    let signature = sig1
        .signature
        .clone()
        .ok_or_else(|| HimaError::Invalid(format!("honest signing failed: {:?}", sig1.error)))?;
    if !sig2.ok {
        return Err(HimaError::Invalid("second honest signing failed".into()));
    }

    let cheater = signers[1];
    let (_, cheat) = run(Some(cheater))?;

    Ok(SelfTestReport {
        participants: n,
        threshold: t,
        verifies_under_randomized_key: verify(&round1.randomized_key, message, &signature)?,
        verifies_under_group_key: verify(&group_key, message, &signature)?,
        randomized_keys_differ: round1.randomized_key != round2.randomized_key,
        randomized_key_1: round1.randomized_key,
        randomized_key_2: round2.randomized_key,
        group_key,
        cheater,
        culprits_named: cheat.culprits,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn full_game_3_of_5() {
        let r = self_test(5, 3).expect("self test");
        assert!(r.verifies_under_randomized_key, "signature must verify under rk");
        assert!(!r.verifies_under_group_key, "signature must NOT verify under the group key");
        assert!(r.randomized_keys_differ, "each signature gets a fresh randomized key");
        assert_eq!(r.culprits_named, vec![r.cheater], "cheater detection names exactly the cheater");
    }

    #[test]
    fn two_signers_cannot_meet_threshold_of_three() {
        let r1 = dkg_part1(1, 3, 3).unwrap();
        let r2 = dkg_part1(2, 3, 3).unwrap();
        // Part 2 with too few round-1 packages must fail: the DKG needs everyone.
        let only_one: BTreeMap<u16, String> = [(2u16, r2.package)].into();
        assert!(dkg_part2(&r1.secret, &only_one).is_err());
    }

    #[test]
    fn rejects_bad_threshold() {
        assert!(self_test(3, 4).is_err());
        assert!(self_test(3, 1).is_err());
    }
}
