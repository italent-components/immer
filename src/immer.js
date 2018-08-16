export {setAutoFreeze, setUseProxies} from "./common"

import {applyPatches as applyPatchesImpl} from "./patches"
// 工具函数 
import {isProxyable, getUseProxies} from "./common"
//
import {produceProxy} from "./proxy"
import {produceEs5} from "./es5"


/**
 * produce takes a state, and runs a function against it.
 * That function can freely mutate the state, as it will create copies-on-write.
 * This means that the original state will stay unchanged, and once the function finishes, the modified state is returned
 *
 * @export
 * 参数 传入的state
 * @param {any} baseState - the state to start with 
 * 接收状态的代理作为第一个参数，并且可以自由修改的函数
 * @param {Function} producer - function that receives a proxy of the base state as first argument and which can be freely modified
 * 可选的函数，将与这里生成的所有补丁一起调用
 * @param {Function} patchListener - optional function that will be called with all the patches produces here
 * 返回值 新的state
 * @returns {any} a new state, or the base state if nothing was modified
 */
// 生产
export function produce(baseState, producer, patchListener) {
    // prettier-ignore
    // 参数判断
    if (arguments.length < 1 || arguments.length > 3) throw new Error("produce expects 1 to 3 arguments, got " + arguments.length)
    // prettier-ignore
    // 如果st
    // curried invocation
    // 参数校验
    if (typeof baseState === "function") {
        // prettier-ignore
        if (typeof producer === "function") throw new Error("if first argument is a function (curried invocation), the second argument to produce cannot be a function")
        // 判断初始状态
        const initialState = producer
        const recipe = baseState

        return function() {
            const args = arguments

            const currentState =
                args[0] === undefined && initialState !== undefined
                    ? initialState
                    : args[0]

            return produce(currentState, draft => {
                args[0] = draft // blegh!
                return recipe.apply(draft, args)
            })
        }
    }

    // prettier-ignore
    //  参数校验
    {
        if (typeof producer !== "function") throw new Error("if first argument is not a function, the second argument to produce should be a function")
        if (patchListener !== undefined && typeof patchListener !== "function") throw new Error("the third argument of a producer should not be set or a function")
    }
    // 判断原始state也就是null状态
    // if state is a primitive, don't bother proxying at all
    if (typeof baseState !== "object" || baseState === null) {
        const returnValue = producer(baseState)
        return returnValue === undefined ? baseState : returnValue
    }

    if (!isProxyable(baseState))
        throw new Error(
            `the first argument to an immer producer should be a primitive, plain object or array, got ${typeof baseState}: "${baseState}"`
        )
    return getUseProxies()
        ? produceProxy(baseState, producer, patchListener)
        : produceEs5(baseState, producer, patchListener)
}

// 默认导出
export default produce

// 非默认导出
export const applyPatches = produce(applyPatchesImpl)
