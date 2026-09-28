export const workManagementForms = Object.freeze({
  milestone: 65,
  typedAuthority: 'src/design-system/form-system.ts',
  presentationAuthority: 'assets/css/foundation/components.css',
  publicApi: 'src/design-system/index.ts',
  canonical: Object.freeze(['field', 'input', 'textarea', 'native-select', 'form-grid'] as const),
  semantics: Object.freeze({
    nativeControlsFirst: true,
    labelAssociationRequired: true,
    descriptionUsesAriaDescribedBy: true,
    invalidStateUsesAriaInvalid: true,
    invalidMessageUsesAriaErrorMessage: true,
    requiredStateUsesNativeRequired: true,
    disabledStateUsesNativeDisabled: true,
    fieldMessagesAreNotLiveRegionsByDefault: true,
  }),
  ownership: Object.freeze({
    formStructureAndControlSemantics: 65,
    customSelectComboboxAndFloatingChoices: 66,
    asynchronousFeedbackAndEmptyErrorExperiences: 67,
    consumerMigration: Object.freeze({ shell: 72, boards: 73, timeTracker: 74, fuelTrack: 75, tradeLink: 76 }),
  }),
  constraints: Object.freeze({
    noFormStateLibraryIntroduced: true,
    noSubmissionOrPersistenceOwnership: true,
    noConsumerRewriteRequiredInM65: true,
    preserveCertifiedM64Authorities: true,
  }),
});

export type WorkManagementFormComponent = typeof workManagementForms.canonical[number];
