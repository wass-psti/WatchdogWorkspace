# M65 Form & Data-Entry Experience Architecture

M65 establishes the canonical typed form-field and native data-entry contract without migrating feature consumers.

## Ownership

- `src/design-system/forms` owns typed shared field/input/textarea/native-select/form-grid adapters.
- `assets/css/foundation/components.css` remains the certified framework-agnostic presentation authority.
- Application features retain their existing form state, validation execution, submission, persistence, and authorization logic.
- M66 owns custom select/combobox/floating-choice interaction architecture.
- M67 owns asynchronous feedback, status, empty-state, and error experience architecture.

## Semantic contract

Fields preserve native form semantics. Labels are explicitly associated with controls. Descriptions and messages are composed through `aria-describedby`; invalid fields use `aria-invalid` and `aria-errormessage`; required and disabled states use native attributes. Field messages are not live regions by default.

## Migration policy

M65 is additive. Shell, Boards, TimeTracker, FuelTrack+, and TradeLink consumer migration remains deferred to M72–M76.
