# M60 corrective — M58/M59 historical theme ownership

During M60 verification, the inherited M58 deterministic verifier failed because it permanently required `assets/css/foundation/themes.css` to match the pre-M60 byte hash. M59 repeated that same freeze. This conflicts with the already-governed successor boundary assigning color/theme/contrast changes to M60.

The correction preserves M58/M59 inventory and architecture assertions, but applies the historical byte freeze only while no M60 target authority exists. Once M60 exists, the M60 deterministic verifier owns palette-value and contrast validation. No application runtime, persistence, routing, authorization, backend, or module business logic is changed by this corrective.
