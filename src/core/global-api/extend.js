/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { defineComputed, proxy } from '../instance/state'
import { extend, mergeOptions, validateComponentName } from '../util/index'

export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   */
  // extend方法返回一个子类构造器
  Vue.extend = function (extendOptions: Object): Function {
    // 扩展选项初始化
    extendOptions = extendOptions || {}
    // this只想Super
    const Super = this
    // SuperId为实例的cid
    const SuperId = Super.cid
    // 初始化_Ctor属性
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    // 如果已缓存，则直接返回
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }
    // 组件名称
    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }

    // 子类构造器
    const Sub = function VueComponent (options) {
      this._init(options)
    }
    // 继承父类原型
    Sub.prototype = Object.create(Super.prototype)
    // 矫正原型constructor
    Sub.prototype.constructor = Sub
    // 组件cid 并++
    Sub.cid = cid++
    // 合并父子选项
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    // 子类super属性指向父类
    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      // 初始化props，扩展到_props对象的属性中
      initProps(Sub)
    }
    if (Sub.options.computed) {
      // 初始化computed，扩展到原型属性
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    // 允许递归查找自身，所以有需要递归自身的组件必须传递name属性
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // cache constructor
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

function initProps (Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

function initComputed (Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
