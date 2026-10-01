export { WorkManagementDesignSystemProvider } from './WorkManagementDesignSystemProvider.tsx';
export type { WorkManagementDesignSystemProviderProps } from './WorkManagementDesignSystemProvider.tsx';
export { workManagementFoundation, workManagementSemanticColors, workManagementBreakpoints } from './foundation.ts';
export { workManagementSemanticLanguage } from './semantic-language.ts';
export type { WorkManagementHierarchy, WorkManagementContentPriority, WorkManagementInteractionPriority, WorkManagementSurfaceRole, WorkManagementDensityIntent, WorkManagementSpatialIntent, WorkManagementEmphasis, WorkManagementAlignmentIntent } from './semantic-language.ts';
export * from './primitives/index.ts';
export * from './interactions/index.ts';
export * from './components/index.ts';
export * from './forms/index.ts';
export { workManagementForms } from './form-system.ts';
export * from './overlays/index.ts';
export { workManagementOverlays } from './overlay-system.ts';
export type { WorkManagementOverlayKind, WorkManagementFloatingSurfaceWidth } from './overlay-system.ts';
export * from './feedback/index.ts';
export { workManagementFeedback } from './feedback-system.ts';
export type { WorkManagementFeedbackKind, WorkManagementFeedbackTone, WorkManagementFeedbackAnnouncement } from './feedback-system.ts';
export type { WorkManagementFormComponent } from './form-system.ts';
export { workManagementCoreComponents } from './core-component-system.ts';
export type { WorkManagementCoreComponentCategory } from './core-component-system.ts';
export * from './icons/index.tsx';
export { workManagementTokens } from './tokens.ts';
export type { WorkManagementTokenReferences } from './tokens.ts';
export { futuristicMinimalistTokenContract } from './futuristic-token-contract.ts';
export type { FuturisticMinimalistTokenCategory } from './futuristic-token-contract.ts';

export { workManagementTypography } from './typography-system.ts';
export type { WorkManagementTypographyRole, WorkManagementTextFlow } from './typography-system.ts';
export { workManagementThemeContract } from './theme-contract.ts';
export type { WorkManagementThemeMode } from './theme-contract.ts';

export { workManagementLayout } from './layout-system.ts';
export type { WorkManagementClusterGap, WorkManagementContentWidth, WorkManagementGridColumns, WorkManagementGridGap, WorkManagementStackGap } from './layout-system.ts';

export { workManagementResponsive } from './responsive-system.ts';
export type { WorkManagementAdaptiveCollapse, WorkManagementBreakpoint } from './responsive-system.ts';

export { workManagementAccessibility, WMLiveRegion, WMVisuallyHidden } from './accessibility-system.tsx';
export type { WorkManagementLivePoliteness, WMLiveRegionProps, WMVisuallyHiddenProps } from './accessibility-system.tsx';
export * from './data/index.ts';
export { workManagementDataPresentationSystem } from './data-presentation-system.ts';
export type { WorkManagementDataPresentationSystem } from './data-presentation-system.ts';

export * from './analytics/index.ts';
export { workManagementAnalyticsPresentationSystem } from './analytics-presentation-system.ts';
export type { WorkManagementAnalyticsPresentationSystem } from './analytics-presentation-system.ts';

export { workManagementMotionContinuitySystem } from './motion-continuity-system.ts';
export type { WorkManagementMotionContinuitySystem, WMMotionContinuityKind, WMMotionContinuityPriority } from './motion-continuity-system.ts';

export { workManagementHostMigrationSystem } from './host-migration-system.ts';
export type { WorkManagementHostMigratedSurface } from './host-migration-system.ts';

export * from './boards-migration-system.ts';
export * from './time-tracker-harmonization-system';
export * from './fueltrack-plus-harmonization-system';
export * from './tradelink-harmonization-system';

export * from './final-ui-production-certification-system';

// Stage I M80 — Futuristic Minimalist shared primitive component boundary.
export { WMAlert, WMCard, WMFilterBar, WMFilterChip, WMSearchInput, WMSelector, WMSegmentedControl } from './shared-primitives/index.ts';
export type { WMAlertProps, WMCardProps, WMFilterBarProps, WMFilterChipProps, WMSearchInputProps, WMSelectorProps, WMSegmentedControlOption, WMSegmentedControlProps } from './shared-primitives/index.ts';
export { workManagementSharedPrimitiveSystem } from './shared-primitive-system.ts';
export type { WorkManagementSharedPrimitiveCategory } from './shared-primitive-system.ts';

// Stage I M81 — Application shell and global navigation composition boundary.
export { WMApplicationShellFrame, WMGlobalNavigation, WMShellHeaderFrame, WMShellNavigationScroll, WMShellStatusFooter, WMGlobalPageFrame } from './application-shell/index.tsx';
export type { WMApplicationShellFrameProps, WMGlobalNavigationProps, WMShellHeaderFrameProps, WMShellNavigationScrollProps, WMShellStatusFooterProps, WMGlobalPageFrameProps } from './application-shell/index.tsx';
export { workManagementApplicationShellSystem } from './application-shell-system.ts';
export type { WorkManagementApplicationShellHierarchy } from './application-shell-system.ts';

// Stage I M82 — Layout, surface and responsive composition boundary.
export { WMPageLayout, WMContentContainer, WMSectionLayout, WMSurfaceSection, WMResponsiveGrid, WMResponsiveCluster, WMLayoutStack } from './layout-composition/index.tsx';
export type { WMPageLayoutProps, WMContentContainerProps, WMSectionLayoutProps, WMSurfaceSectionProps, WMResponsiveGridProps, WMResponsiveClusterProps, WMLayoutStackProps } from './layout-composition/index.tsx';
export { workManagementLayoutCompositionSystem } from './layout-composition-system.ts';
export type { WorkManagementLayoutCompositionPrimitive, WorkManagementViewportClass, WorkManagementLayoutDensity, WorkManagementGridProfile, WorkManagementClusterProfile } from './layout-composition-system.ts';

// Stage I M83 — Authentication & Account Surfaces presentation boundary.
export { WMIdentitySurface, WMIdentityPanel, WMIdentityBrand, WMAccountSurface, WMAccountSection } from './authentication-account/index.tsx';
export { workManagementAuthenticationAccountSystem } from './authentication-account-system.ts';
export type { WorkManagementIdentitySurface } from './authentication-account-system.ts';

// Stage I M84 — Boards Visual Migration presentation boundary.
export { workManagementBoardsVisualMigrationSystem } from './boards-visual-migration-system.ts';
export type { WorkManagementBoardsVisualSurface } from './boards-visual-migration-system.ts';

export * from './time-tracker-visual-migration-system';
export { workManagementStateSystem } from './state-system.ts';
export type { WorkManagementLifecycleState, WorkManagementValidationState } from './state-system.ts';

// Stage I M93 — Accessibility & Interaction-State Harmonization successor boundary.
export { workManagementInteractionStateHarmonizationSystem } from './interaction-state-harmonization-system.ts';
export type { WorkManagementInteractionState } from './interaction-state-harmonization-system.ts';

// Stage I M94 — Motion & Transition Architecture successor boundary.
export { workManagementMotionTransitionArchitectureSystem } from './motion-transition-architecture-system.ts';
export type { WorkManagementMotionDomain, WorkManagementMotionTransitionArchitectureSystem } from './motion-transition-architecture-system.ts';
