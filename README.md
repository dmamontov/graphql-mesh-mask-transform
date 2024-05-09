# Mask Transform for GraphQL Mesh

Mask Transform - is a plugin for GraphQL Mesh that provides the capability to transform and mask data in GraphQL API responses. This transform allows you to define patterns for altering data structures and rules for masking sensitive information, thereby enhancing the security and flexibility of your API.

## Installation

Before you can use the Mask Transform, you need to install it along with GraphQL Mesh if you haven't already done so. You can install these using npm or yarn.

```bash
npm install @dmamontov/graphql-mesh-mask-transform
```

or

```bash
yarn add @dmamontov/graphql-mesh-mask-transform
```

## Configuration

### Modifying tsconfig.json

To make TypeScript recognize the Mask Transform, you need to add an alias in your tsconfig.json.

Add the following paths configuration under the compilerOptions in your tsconfig.json file:

```json
{
  "compilerOptions": {
    "paths": {
       "mask": ["node_modules/@dmamontov/graphql-mesh-mask-transform"]
    }
  }
}
```

### Adding the Transform to GraphQL Mesh

You need to include the Mask Transform in your GraphQL Mesh configuration file (usually .meshrc.yaml). Below is an example configuration that demonstrates how to use this transform:

```yaml
transforms:
  - mask:
      typeName: Cards
      fieldName: number
      mask: "0000 00** **** 0000"
```

### Special Mask Characters

| Character | Description                                                                |
|-----------|----------------------------------------------------------------------------|
| `0`       | Any numbers                                                                |
| `9`       | Any numbers (Optional)                                                     |
| `#`       | Any numbers (recursive)                                                    |
| `A`       | Any alphanumeric character                                                 |
| `a`       | Any alphanumeric character (Optional) **Not implemented yet**              |
| `S`       | Any letter                                                                 |
| `U`       | Any letter (All lower case character will be mapped to uppercase)          |
| `L`       | Any letter (All upper case character will be mapped to lowercase)          |
| `$`       | Escape character, used to escape any of the special formatting characters. |
| `*`       | Masked character.                                                          |

## Conclusion

Remember, always test your configurations in a development environment before applying them in production to ensure that everything works as expected.