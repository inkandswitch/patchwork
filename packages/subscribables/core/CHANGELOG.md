# @inkandswitch/subscribables

## 0.1.2

### Patch Changes

- 398dffc: - Rename Signal → Subscribable
  - Rename SignalValue → SubscribableValue
  - Rename SignalObject → SubscribableObject
  - Rename valueOfSignal → valueOfSubscribable
  - Rename isSignalValue → isSubscribableValue

## 0.1.1

### Patch Changes

- c7e5e1f: ensure dist folder ist included in package

## 0.1.0

### Minor Changes

- 4ba3100: - `Signal`, `SignalValue`, and `SignalObject` types
  - `computed()` for derived subscribables
  - `SubscriberSet` for managing subscriptions
  - `valueOfSignal()` and `isSignalValue()` helpers
