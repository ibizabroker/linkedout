type PageWindow = { readonly content?: { readonly fetch?: typeof fetch } };

export const pageFetch: typeof fetch = (input, init) => {
  const url = typeof input === 'string' ? new URL(input, location.href).href : input;
  const pageContext = (globalThis as PageWindow).content;
  return typeof pageContext?.fetch === 'function' ? pageContext.fetch(url, init) : fetch(url, init);
};
