import {validateObject} from "./validate-object";
import {isObjectValidationError} from "./data/ObjectValidationError";
import {SupportedType} from "./data/SupportedType";


const builtInTypeMap = new Map<SupportedType, any>([
    ["undefined", undefined],
    ["object", {}],
    ["boolean", true],
    ["number", 1],
    ["bigint", BigInt(1)],
    ["string", "string"],
    ["symbol", Symbol("symbol")],
    ["function", () => 1]
]);

/**
 * Validate that only listed types are returned as matching ones
 * @param property Value
 * @param validTypes list of types that should be matched and all other should not
 */
const validateProperty = (property: any, ...validTypes: SupportedType[]) => {
    for (const type of builtInTypeMap.keys()) {
        const result = validateObject({property}, [{field: "property", type: type}]);
        if (validTypes.includes(type) && result === true) {
            continue;
        }
        if (!validTypes.includes(type) && result !== true) {
            continue;
        }
        // console.log({validTypes, property, type, result});
        return false;
    }
    return true;
};

describe("Object validation", () => {
    it("Non object will cause error", () => {
        expect(isObjectValidationError(validateObject(true as any, []))).toBe(true)
    });
    it("Allow extra fields is supported", () => {
        expect(validateObject({a: 1}, [], true)).toBe(true);
        expect(validateObject({a: 1}, [], false)).not.toBe(true);
    });
    it("Builtin value types are matched correctly", () => {
        for (const [type, property] of builtInTypeMap) {
            expect(validateProperty(property, type)).toBe(true);
        }
    });
    it("Can match array type", () => {
        expect(validateProperty([1, 2, 3], "array", "object")).toBe(true);
        expect(validateProperty([1, 2, 3], "string[]")).not.toBe(true);
    });
    it("Can match array of strings", () => {
        expect(validateProperty(["1", "2", "3"], "string[]", "object", "array")).toBe(true);
    });
    it("Can validate field value", () => {
        expect(validateObject({property: 0}, [{field: "property", validator: v => v === 0}])).toBe(true);
    });
    it("Can detect empty value", () => {
        expect(validateObject({property: 0}, [{field: "property", notEmpty: true}])).toBe(true);
        expect(validateObject({property: false}, [{field: "property", notEmpty: true}])).toBe(true);
        expect(validateObject({property: []}, [{field: "property", notEmpty: true}])).toBe(true);
        expect(validateObject({property: ''}, [{field: "property", notEmpty: true}])).not.toBe(true);
        expect(validateObject({property: undefined}, [{field: "property", notEmpty: true}])).not.toBe(true);
    });
    it("Can validate array item value", () => {
        expect(validateObject({
                property: [1, 2, 3, 4, 5]
            }, [{
                field: "property",
                type: "array",
                itemValidator: v => v > 0
            }])
        ).toBe(true);
        expect(validateObject({
                property: [1, 2, 0, 4, 5]
            }, [{
                field: "property",
                type: "array",
                itemValidator: v => v > 0
            }])
        ).not.toBe(true);
    });
});
