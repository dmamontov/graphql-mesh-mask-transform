import {
    GraphQLString,
    isScalarType,
    Kind,
    type FieldNode,
    type GraphQLFieldConfig,
    type GraphQLSchema,
} from 'graphql';
import {
    applyRequestTransforms,
    applyResultTransforms,
    applySchemaTransforms,
} from '@graphql-mesh/utils';
import {
    type DelegationContext,
    type SubschemaConfig,
    type Transform,
} from '@graphql-tools/delegate';
import { type ExecutionRequest, type ExecutionResult } from '@graphql-tools/utils';
import { TransformCompositeFields } from '@graphql-tools/wrap';
import Maskara from './maskara';
import { type MaskTransformAlias, type MaskTransformConfig } from './types';

export default class MaskTransform implements Transform {
    public noWrap: boolean = false;
    private readonly configs: MaskTransformConfig[];
    private readonly aliases: MaskTransformAlias[] = [];
    private readonly transformers: TransformCompositeFields[];

    constructor({ config }: { config: MaskTransformConfig[] }) {
        this.configs = config;
        this.transformers = [
            new TransformCompositeFields(
                (
                    typeName: string,
                    fieldName: string,
                    fieldConfig: GraphQLFieldConfig<any, any>,
                ): GraphQLFieldConfig<any, any> =>
                    this.wrap(typeName, fieldName, fieldConfig) as GraphQLFieldConfig<any, any>,
                (typeName: string, fieldName: string, fieldNode: FieldNode): FieldNode =>
                    this.saveAlias(typeName, fieldName, fieldNode),
                (value: any): any => this.serialize(value),
            ),
        ];
    }

    transformSchema(
        originalWrappingSchema: GraphQLSchema,
        subschemaConfig: SubschemaConfig,
        transformedSchema?: GraphQLSchema,
    ) {
        return applySchemaTransforms(
            originalWrappingSchema,
            subschemaConfig,
            transformedSchema,
            this.transformers,
        );
    }

    public transformRequest(
        originalRequest: ExecutionRequest,
        delegationContext: DelegationContext,
        transformationContext: any,
    ): ExecutionRequest {
        return applyRequestTransforms(
            originalRequest,
            delegationContext,
            transformationContext,
            this.transformers,
        );
    }

    transformResult(
        originalResult: ExecutionResult,
        delegationContext: DelegationContext,
        transformationContext: any,
    ) {
        return applyResultTransforms(
            originalResult,
            delegationContext,
            transformationContext,
            this.transformers,
        );
    }

    private wrap(
        typeName: string,
        fieldName: string,
        fieldConfig: GraphQLFieldConfig<any, any>,
    ): any {
        const config = this.getConfig(typeName, fieldName);

        if (config && !isScalarType(fieldConfig.type)) {
            throw new TypeError('Only scalar type can be masked.');
        }

        return {
            ...fieldConfig,
            type: config ? GraphQLString : fieldConfig.type,
        };
    }

    private saveAlias(typeName: string, fieldName: string, fieldNode: FieldNode): any {
        const config = this.getConfig(typeName, fieldName);

        if (!config) {
            return fieldNode;
        }

        if (fieldNode.kind === Kind.FIELD) {
            if (!this.aliases.find(alias => alias.type === typeName && alias.name === fieldName)) {
                this.aliases.push({
                    type: typeName,
                    name: fieldName,
                    alias: fieldNode?.alias ? fieldNode.alias.value : fieldName,
                });
            }

            return fieldNode;
        }

        return fieldNode;
    }

    private serialize(value: any): any {
        if (!(typeof value === 'object') || !value?.__typename) {
            return value;
        }

        const types = this.configs.filter(config => config.typeName === value.__typename);

        if (types.length === 0) {
            return value;
        }

        for (const type of types) {
            let fieldNameOrAlias = type.fieldName;
            const alias = this.aliases.find(
                aliasConfig =>
                    aliasConfig.type === value.__typename && aliasConfig.name === type.fieldName,
            );

            if (alias) {
                fieldNameOrAlias = alias.alias;
            }

            if (value[fieldNameOrAlias] && type.mask) {
                value[fieldNameOrAlias] = Maskara.apply(
                    value[fieldNameOrAlias].toString(),
                    type.mask,
                );
            }
        }

        return value;
    }

    private getConfig(typeName: string, fieldName: string): MaskTransformConfig | undefined {
        return this.configs.find(
            config => config.typeName === typeName && config.fieldName === fieldName,
        );
    }
}
