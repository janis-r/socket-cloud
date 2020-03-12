import {FieldConfiguration, Validator} from "../../utils/validator";
import {uniqueValues} from "ugd10a";

export class MessageValidator<T> {

    private readonly validator: Validator<T>;
    private readonly allFields: string[];
    private readonly requiredFields: string[];
    private readonly configMap: Map<string, Configuration<T>>;
    private readonly fieldSerializers: Map<string, Configuration<T>['itemSerializer']>;
    private readonly fieldDeserializers: Map<string, Configuration<T>['itemDeserializer']>;

    constructor(readonly config: ReadonlyArray<Configuration<T>>) {
        this.validator = new Validator(config);
        const allFields = [];
        const requiredFields = [];
        const configMap = new Map<string, Configuration<T>>();
        const fieldSerializers = new Map<string, Configuration<T>['itemSerializer']>();
        const fieldDeserializers = new Map<string, Configuration<T>['itemDeserializer']>();

        config.map(value => {
            const {field, optional} = value;
            configMap.set(field as string, value);
            if (value.itemSerializer) {
                fieldSerializers.set(field as string, value.itemSerializer);
            }
            if (value.itemDeserializer) {
                fieldDeserializers.set(field as string, value.itemDeserializer);
            }
            return {field: field as string, optional};
        }).forEach(({field, optional}) => {
            allFields.push(field);
            if (optional) {
                requiredFields.push(field);
            }
        });
        this.allFields = allFields;
        this.requiredFields = requiredFields;
        this.configMap = configMap;
        this.fieldSerializers = fieldSerializers;
        this.fieldDeserializers = fieldDeserializers;
    }

    get lastValidationError() {
        return this.validator.lastError;
    }

    readonly validate = (value: unknown): value is T => this.validator.validate(value);

    readonly serialize = (value: T): string | null => {
        const {validate, allFields, fieldSerializers} = this;
        if (!validate(value)) {
            return null;
        }
        return JSON.stringify(allFields.map(field => {
            if (fieldSerializers.has(field)) {
                const entrySerializer = fieldSerializers.get(field);
                const {type} = this.configMap.get(field);
                if (type === "array" || type === "string[]") {
                    return value[field].map(entrySerializer);
                }
                return entrySerializer(value[field]);
            }
            return value[field];
        }));
    };

    readonly deserialize = (value: string | Array<any>): T | null => {
        const {allFields, fieldDeserializers, configMap} = this;
        let data;
        if (typeof value === "string") {
            try {
                data = JSON.parse(value);
            } catch (e) {
                console.log(`Error while deserialize`, {value, e});
                return null;
            }
        } else {
            data = value;
        }

        if (!Array.isArray(data) || data.length != allFields.length) {
            console.log(`Error while deserialize - not enough fields`, value);
            return null;
        }

        const parsed = {};
        allFields.forEach(field => {
            const rawValue = data.shift();
            let parsedValue;
            if (fieldDeserializers.has(field)) {
                const entryDeserializer = fieldDeserializers.get(field);
                const {type} = this.configMap.get(field);
                if (type === "array" || type === "string[]") {
                    parsedValue = rawValue.map(entryDeserializer);
                } else {
                    parsedValue = entryDeserializer(rawValue);
                }
            } else {
                parsedValue = rawValue;
            }

            if (Array.isArray(parsedValue) && configMap.get(field).unique) {
                parsed[field] = uniqueValues(parsedValue);
            } else if (parsedValue !== null || !configMap.get(field).optional) {
                parsed[field] = parsedValue;
            }
        });

        if (this.validate(parsed)) {
            return parsed;
        }

        console.log(`Error while deserialize - validation has failed`, {value, parsed});

        return null;
    };

}

type Configuration<T> = FieldConfiguration<T> & {
    itemSerializer?: (value: any) => string,
    itemDeserializer?: (value: string) => any,
    unique?: boolean
}
