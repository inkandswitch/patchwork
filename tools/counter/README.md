# Counter Tool

A simple counter tool for the Patchwork framework.

## Features

- **Increment/Decrement**: Adjust the counter value up or down
- **Reset**: Set the counter back to zero
- **Set Value**: Set the counter to any specific number
- **Double/Halve**: Multiply or divide the counter by 2
- **Real-time sync**: Changes are synchronized across all users viewing the counter
- **Change highlighting**: Visual feedback when the counter value changes

## Usage

The counter tool provides a simple interface with:

- A customizable title
- Large display of the current value
- Buttons to increment (+), decrement (-), and reset the counter

## Actions

The counter tool includes several actions that can be triggered programmatically:

- **Increment Counter**: Increase the value by a specified amount (default: 1)
- **Decrement Counter**: Decrease the value by a specified amount (default: 1)
- **Reset Counter**: Set the value back to 0
- **Set Counter Value**: Set the counter to any specific number
- **Double Counter**: Multiply the current value by 2
- **Halve Counter**: Divide the current value by 2 (only available when value is not 0)

## Development

```bash
# Install dependencies
pnpm install

# Build the tool
pnpm build

# Watch for changes during development
pnpm dev

# Build and sync with Patchwork
pnpm sync
```

## Data Structure

The counter document has the following structure:

```typescript
type CounterDoc = {
  title: string;
  value: number;
};
```
