export function createCompositionEditGate() {
  let owner: symbol | undefined;

  return {
    isLocked: () => owner !== undefined,

    acquire(): symbol | undefined {
      if (owner !== undefined) return undefined;
      owner = Symbol('composition edit lock');
      return owner;
    },

    transfer(current: symbol): symbol | undefined {
      if (owner !== current) return undefined;
      owner = Symbol('composition edit lock');
      return owner;
    },

    release(current: symbol): boolean {
      if (owner !== current) return false;
      owner = undefined;
      return true;
    },
  };
}

export const compositionEditGate = createCompositionEditGate();
