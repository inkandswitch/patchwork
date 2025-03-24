# Patchwork Systems Registry

This directory contains a unified systems registry that allows for registering and querying different types of systems in Patchwork, such as DataTypes, Tools, ImportMethods, and ExportMethods. The unified approach makes it easier to extend the application with new types of systems in the future.

## Core Components

### `registry.ts`

The foundation of the unified system, providing:

- `SystemRegistry` - Generic class for registering and retrieving systems
- `SystemBase` - Base interface for all system types
- `SystemDescription` - Interface for system descriptions with async loaders
- `SystemsExport` - Interface for modules to export multiple system types
- `registerSystems` - Function to register systems from a module export

### `dataTypeSystem.ts`

Implementation of the DataType system, which handles:

- Document structure and versioning
- Change tracking and grouping
- Annotations and anchors
- Document migrations

### `toolSystem.ts`

Implementation of the Tool system, which handles:

- UI components for editing and viewing documents
- Annotation rendering and interaction
- Comments and review features

### `exportMethodSystem.ts`

Implementation of the ExportMethod system, which handles:

- Document export to various file formats
- Format-specific export logic
- Default export method selection

### `importMethodSystem.ts`

Implementation of the ImportMethod system, which handles:

- Document import from various file formats
- Format-specific import logic
- Default import method selection

## Type System

The system uses a simplified type system that prioritizes practical usability over perfect type safety:

- Types use `any` for most generic parameters to avoid excessive type constraints
- Type assertions are used at the boundaries for better developer experience
- Internal type safety is maintained through explicit type casting
- This approach balances type safety with flexibility and simplicity

## Usage Example

See `example.ts` for a complete example of:

1. Defining and registering a DataType
2. Defining and registering a Tool
3. Defining and registering Import and Export methods
4. Using the systems to create and work with documents

## Modular System Export

The system supports a unified way for modules to export multiple system types:

```typescript
// Example module.ts
export const systems = {
  dataTypes: [myDataType1, myDataType2],
  tools: [myTool1, myTool2],
  exportMethods: [myExportMethod],
  importMethods: [myImportMethod]
};

// In the application:
import { systems } from 'my-module';
import { registerSystems } from 'patchwork/systems';

// Register all systems at once
await registerSystems(systems, 'my-module-url');
```

This approach allows modules to provide multiple system types through a single export, making it easier to create and use plugins.

## Key Benefits

1. **Consistency**: All systems share the same registration and retrieval mechanisms
2. **Extensibility**: New system types can be added without changing the core registry
3. **Simplicity**: The type system has been simplified to avoid overly complex generic constraints
4. **Discoverability**: Systems can be queried by ID or capabilities
5. **Practicality**: Balances compile-time safety with runtime flexibility
6. **Modularity**: Supports exporting multiple system types from a single module

## Future Improvements

The unified system can be extended with additional system types like:

- Renderers - For displaying documents in different formats
- Extensions - For extending the functionality of the application
- Transforms - For converting between different document types
- Validators - For validating document structure and content 