# Hima

**A multiplayer browser game that teaches Zcash's FROST threshold signatures by having you do them, running the Zcash Foundation's real FROST v3 code compiled to WebAssembly.**

*Hima (हिम) is Sanskrit for frost.*

> **Unaudited. For education only.** Hima signs demo messages, never transactions. No ZEC, no wallets, no seed phrases.

**▶ Live:** https://hima-dusky.vercel.app · **Play:** https://hima-dusky.vercel.app/play · **Demo video:** _coming soon_

---

## Why it matters

FROST is becoming one of Zcash's most important primitives. FROST vaults, treasuries and multisigs are shipping, and with re-randomized FROST ([ZIP 312](https://zips.z.cash/zip-0312), draft) a group spend can look exactly like any other Orchard spend.

But the people asked to *hold* the shares mostly don't know what a share is, what a key ceremony does, or why a cheater can't fake a signature. Hima turns the protocol into something a room full of students can feel in 15 minutes. It was built for the Zcash India community and campus club events.

## What you play

| Level | You do | You learn |
|---|---|---|
| **1 · Key Ceremony** | 3–5 players run distributed key generation (DKG): broadcast commitments, deal private shares, derive keys | One group key exists, and its private key is never computed anywhere |
| **2 · Catch the Cheater** | One signer is secretly dealt the cheater role and signs a different message. Players vote on who they suspect, then aggregate | FROST v3 checks every signature share and **names** the culprit. With spare signers (n > t), the group retries without them |
| **3 · Old Shares** | *Stretch goal, not yet built.* Refresh shares, then mix old and new | What a share refresh does and doesn't protect |
| **4 · Unlinkable** | Sign the same message twice with re-randomized FROST, then try to link the signatures | Each signature verifies only under a one-time key (group key + α·G), never the group key |

The landing page also has a **"Run real FROST"** button that runs a full 5-player game in your browser in under a second.

## How FROST works (simply)

- **Threshold:** a key is split among *n* people so that any *t* of them can sign together, while *t−1* can't sign and learn nothing.
- **Key ceremony (DKG):** nobody ever holds the whole key. Each player invents a random polynomial, publishes commitments to it, and privately sends each other player one point on it. Everyone's key share is the sum of what they received, and the group public key is the sum of the commitments.
- **Signing:** each signer commits to fresh one-time nonces, then sends a *signature share*. The coordinator checks every share against that player's public verifying share before combining them into one ordinary Schnorr (RedPallas) signature. A bad share is caught and attributed.
- **Re-randomized FROST:** each signing round adds a random α, so the signature verifies under `group key + α·G`. That's the per-spend randomized key `rk` that every Orchard spend already publishes, so outsiders can't link a group's spends to each other or to the group.

## Quickstart

Play the hosted version, or run it locally:

```bash
cd web
pnpm install
pnpm dev            # http://localhost:3000, then open /play
pnpm build          # static site in web/out (host anywhere)
```

The compiled WebAssembly (`web/public/wasm/`) and its JS bindings (`web/src/lib/frost/pkg/`) are committed, so **you don't need Rust to run the site**.

### Rebuilding the WASM engine (optional)

Linux, macOS or WSL:

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.130 --locked
./crates/frost-wasm/build-wasm.sh       # runs tests, builds, regenerates bindings
```

The native tests run a full 3-of-5 game: DKG, two re-randomized signatures, and cheater detection.

```bash
cd crates/frost-wasm && cargo test --release
```

> On Windows with Smart App Control enabled, cargo's build scripts are blocked as unsigned executables. Build inside WSL.

## Architecture

```
┌─────────────────────── browser tab (hot-seat: all players) ───────────────────────┐
│                                                                                    │
│  Next.js UI  ──►  lib/game/engine.ts  ──►  lib/frost (typed client)                │
│  (levels, log)    (protocol steps,          │                                      │
│                    no UI)                   ▼                                      │
│                                     frost-wasm (Rust → WebAssembly, 508 KB)        │
│                                     ├─ frost-core 3.0.0  (Zcash Foundation)        │
│                                     ├─ frost-rerandomized 3.0.0                    │
│                                     └─ reddsa 0.5.2 · RedPallas ciphersuite        │
│                                        getrandom "js" → crypto.getRandomValues()   │
└────────────────────────────────────────────────────────────────────────────────────┘
```

- `crates/frost-wasm/`: stateless Rust API (DKG parts 1–3, commit, signing round, sign, simulated cheat, aggregate with cheater detection, verify). Protocol objects cross the boundary as hex-encoded frost-core serializations.
- `web/src/lib/frost/`: the typed TypeScript client over the generated bindings.
- `web/src/lib/game/engine.ts`: each level's protocol steps as pure functions.
- `web/src/components/game/`: the game UI. A live **protocol log** shows every real message and its size.
- `web/src/components/hero/`: the landing page's 3D scene (react-three-fiber). It's an illustration only.

`reddsa` is pinned to **0.5.2**, the last Zcash Foundation release with the `frost` feature. The 0.6 line removed it.

## Limitations and threat model

- **Unaudited.** The upstream FROST crates have independent audits. This wrapper and app do not.
- **Demo keys only.** Shares live in tab memory and disappear when you close it. Never use a Hima key for real funds.
- **Hot-seat mode:** all players share one screen, so every player's secrets are in the same tab. This is fine for teaching, but it isn't how a real wallet should work.
- **Simulated cheater:** in Level 2 the cheater really signs a different message with their real key share. The role is simulated, the cryptography is not, and the UI labels it.
- **Room mode (one phone each) is not built yet.** In its design the relay is untrusted: DKG round-2 packages must be encrypted to each recipient before they leave the device, so the relay sees only public commitments and ciphertext.
- **Re-randomized FROST (ZIP 312) is a draft standard.** Hima teaches the idea and is not a reference implementation.
- **Nonces are single-use.** The engine deletes them right after signing.

## Roadmap

1. **Now: hackathon MVP.** Hot-seat Levels 1, 2 and 4, open source (MIT).
2. **Room mode:** one phone per player over a WebSocket relay, with end-to-end encrypted DKG round-2 packages and QR join.
3. **Live on campus:** sessions through the Zcash India Community Club. Test: can a first-year explain a threshold signature after 15 minutes?
4. **Ceremony kit:** the WASM core and ceremony UI, packaged for FROST wallet teams (key ceremonies, signer messaging, recovery flows).
5. **"What am I co-signing?":** a plain-language transaction (PCZT) check before a signer contributes their share.

## License

[MIT](LICENSE). Built by [@avishrakshe](https://github.com/avishrakshe) for Zcash India's "Build on Zcash" 2026. An independent community project, not affiliated with the Zcash Foundation or Electric Coin Company.
