import {diff, cloneObject, parseJson} from './utils/index'
import {Operation, OperationType} from './utils/types'

export function createArkPlugin(namespace: string){
  const StoreKey = `Store_${namespace}`
  let cacheData = {}

  function initState(store: any, StoreKey: string){
    let newData = globalThis[StoreKey]
    if(newData){
      // TODO: 深拷贝
      cacheData = parseJson(JSON.stringify(newData));
      store.replaceState(newData);
    }
  }

  return (store) => {
    if (!globalThis[`${StoreKey}_LIST`]) {
      globalThis[`${StoreKey}_LIST`] = []
    }

    globalThis[`${StoreKey}_LIST`].push(store)
    initState(store, StoreKey)
    store.subscribe((mutation, state) => {
      globalThis[StoreKey] = state

      let ops = diff(cacheData, state);
      if(!ops || ops.length === 0){
        return
      }
      globalThis[`${StoreKey}_LIST`].forEach(iStore => {
        if (iStore && iStore !== store) {
          resetStore(iStore, ops);
        }
      });
      globalThis[StoreKey] = cloneObject(state);
    })
  }
}



function setObjectValue(ob:any, keys:Array<string>, value: any){
  let temp = ob;
  let lastKey = keys.pop();
  keys.forEach((key,index) => {
    temp = temp[key]
  })
  temp && lastKey &&  (temp[lastKey] = value)
}

function resetStore(store: any, operations:Array<Operation>){
 operations.forEach(operation=> {
   updateStore(store, operation)
 })
}

function updateStore(store:any, operation:Operation){
  let {type, key, value} = operation;

  store._withCommit(() => {
    switch(type){
      case OperationType.ADD:
        setObjectValue(store.state, key, value)
        break;
      case OperationType.DELETE:
        setObjectValue(store.state, key, undefined)
        break;
      case OperationType.UPDATE:
        setObjectValue(store.state, key, value)
        break;
      default:
        break;
    }
  })
}