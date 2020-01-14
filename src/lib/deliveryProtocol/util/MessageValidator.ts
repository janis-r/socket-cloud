import {FieldConfiguration, validateObject} from "../../utils/validate-object";
import {uniqueValues} from "ugd10a";

export class MessageValidator<T> {

    private readonly allFields: string[];
    private readonly requiredFields: string[];
    private readonly configMap: Map<string, Configuration<T>>;
    private readonly fieldSerializers: Map<string, Configuration<T>['itemSerializer']>;
    private readonly fieldDeserializers: Map<string, Configuration<T>['itemDeserializer']>;
    private _lastValidationError;

    constructor(readonly config: ReadonlyArray<Configuration<T>>) {
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
        return this._lastValidationError;
    }

    readonly validate = (value: unknown): value is T => {
        const result = validateObject(value, this.config as any);
        this._lastValidationError = result === true ? null : result;
        return result === true;
    };

    readonly serialize = (value: T): string | null => {
        const {validate, allFields, fieldSerializers} = this;
        if (!validate(value)) {
            return null;
        }
        return JSON.stringify(allFields.map(field => {
            if (fieldSerializers.has(field)) {
                return fieldSerializers.get(field)(value[field]);
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
                parsedValue = fieldDeserializers.get(field)(rawValue);
            } else {
                parsedValue = rawValue;
            }

            if (Array.isArray(parsedValue) && configMap.get(field).unique) {
                parsed[field] = uniqueValues(parsedValue);
            } else {
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