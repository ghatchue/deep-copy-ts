declare module owl {
    function clone(target: any): any;
    function copy(target: any): any;
    function deepCopy(source: any, maxDepth: number): any;
    module deepCopy {
        interface IDeepCopier {
            canCopy(source: any): boolean;
            create(source: any): any;
            populate(deepCopyAlgorithm: (source: any) => any, source: any, result: any): any;
        }
        class DeepCopier implements IDeepCopier {
            constructor(config: any);
            canCopy(source: any): boolean;
            create(source: any): any;
            populate(deepCopyAlgorithm: (source: any) => any, source: any, result: any): any;
        }
        var deepCopiers: deepCopy.IDeepCopier[];
    }
    class DeepCopyAlgorithm {
        copiedObjects: any[];
        recursiveDeepCopy: (source: any) => any;
        depth: number;
        maxDepth: number;
        constructor();
        cacheResult(source: any, result: any): void;
        getCachedResult(source: any): any;
        deepCopy(source: any): any;
        applyDeepCopier(deepCopier: deepCopy.IDeepCopier, source: any): any;
    }
    module deepCopy {
        function register(deepCopier: any): any;
        function register(deepCopier: IDeepCopier): any;
    }
}
