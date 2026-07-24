export const useSelfFetch = createUseFetch(callerOptions => ({
  $fetch: selfFetch,
  ...callerOptions,
}))
