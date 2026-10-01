export const stageIM92Target = Object.freeze({
  milestone:92,stage:'I',
  baseline:{certifiedZipSha256:'6f56c62f470b147f03fe22f62b77fba115105ca5ed589ecf1662a2badc9fbb70',certifiedSourceSha256:'6623fffb2c2e222bea87fea60362f0e57eb2ba8c0562f83773b9c0caf52c5658'},
  activationState:'active-certified',
  inheritedM91CssCeiling:619000,
  successorCeiling:621000,
  requiredStateClasses:['async','empty','validation','failure-retry','completion'],
  requiredModules:['authentication','account','users-rbac','settings','boards','time-tracker','fueltrack-plus','tradelink','application-shell','shared-application-ui'],
  schemaMigrationRequired:false,backendMutationRequired:false,authorizationSemanticChange:false,persistenceSemanticChange:false,
});
