# M84 / M83 Adaptive CSS Successor Governance Corrective

- Root cause: the M83 static verifier treated its certified `597000` CSS ceiling as the live global ceiling even after M84 activated its successor `612000` ceiling.
- Correction: M83 continues to require its historical authority record and target evidence (`596211` measured, `597000` certified ceiling) while accepting the live `612000` ceiling only when the M84 budget authority is present.
- M84 remains responsible for enforcing the active `612000` ceiling.
- Authentication/session semantics, Board runtime behavior, persistence, realtime, RBAC, drag/drop, schema and backend contracts are unchanged.
- This is a successor-governance verification correction only.
