# RPAY-POL-103: New Device Fingerprint & Account Takeover Prevention

## 1. Scope
Covers device hardware tokens, browser fingerprints, and new device bindings on existing merchant customer accounts.

## 2. Risk Indicators
- Device age <= 3 days on an established account (> 60 days old).
- Rapid session initiation on unknown user-agent string.

## 3. Decision Framework
- If a new device is accompanied by a routine transaction value (<= customer baseline), request step-up 2FA verification (`VERIFY`).
- If a new device is paired with amount deviation > 3.0x or geographic location mismatch, flag (`FLAG`) and freeze payment until biometric or SMS OTP confirmation is complete.
