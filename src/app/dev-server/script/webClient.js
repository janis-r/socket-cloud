var webClient = (function (exports) {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    var CallbackCollection = (function () {
        function CallbackCollection() {
            var _this = this;
            this.callbacks = new Map();
            this.add = function (callback) {
                var callbacks = _this.callbacks;
                if (callbacks.has(callback)) {
                    return { success: false };
                }
                var callbackProps = {};
                callbacks.set(callback, callbackProps);
                var onComplete = function (callback) { return callbackProps.onComplete = callback; };
                var times = function (count) {
                    callbackProps.executionLimit = count;
                    return { onComplete: onComplete };
                };
                var once = function () { return times(1); };
                var twice = function () { return times(2); };
                var guard = function (func) {
                    callbackProps.guard = func;
                    return { once: once, twice: twice, times: times };
                };
                return { success: true, guard: guard, once: once, twice: twice, times: times };
            };
            this.has = function (callback) { return _this.callbacks.has(callback); };
            this.remove = function (callback) {
                var callbacks = _this.callbacks;
                if (callbacks.has(callback)) {
                    callbacks.delete(callback);
                    return true;
                }
                return false;
            };
            this.clear = function () { return _this.callbacks.clear(); };
            this.execute = function (data) {
                var e_1, _a;
                var callbacks = _this.callbacks;
                var executed = 0;
                try {
                    for (var callbacks_1 = __values(callbacks), callbacks_1_1 = callbacks_1.next(); !callbacks_1_1.done; callbacks_1_1 = callbacks_1.next()) {
                        var _b = __read(callbacks_1_1.value, 2), callback = _b[0], properties = _b[1];
                        if (properties.guard && !properties.guard(data)) {
                            continue;
                        }
                        callback(data);
                        executed++;
                        if (properties.executionLimit) {
                            if (!properties.executionCount) {
                                properties.executionCount = 1;
                            }
                            else {
                                properties.executionCount++;
                            }
                            if (properties.executionCount === properties.executionLimit) {
                                if (properties.onComplete) {
                                    properties.onComplete();
                                }
                                callbacks.delete(callback);
                            }
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (callbacks_1_1 && !callbacks_1_1.done && (_a = callbacks_1.return)) _a.call(callbacks_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return executed;
            };
            this.manage = this.manage.bind(this);
        }
        CallbackCollection.prototype.manage = function (callback) {
            if (callback) {
                return this.add(callback);
            }
            var _a = this, has = _a.has, remove = _a.remove, clear = _a.clear;
            return { has: has, remove: remove, clear: clear };
        };
        return CallbackCollection;
    }());

    var WebSocketAdapter = (function () {
        function WebSocketAdapter(url) {
            var _this = this;
            this.onOpenCallback = new CallbackCollection();
            this.onMessageCallback = new CallbackCollection();
            this.onErrorCallback = new CallbackCollection();
            this.onCloseCallback = new CallbackCollection();
            this.onOpen = this.onOpenCallback.manage;
            this.onMessage = this.onMessageCallback.manage;
            this.onError = this.onErrorCallback.manage;
            this.onClose = this.onCloseCallback.manage;
            this.socket = new WebSocket(url);
            this.socket.onopen = function () { return _this.onOpenCallback.execute(); };
            this.socket.onmessage = function (_a) {
                var data = _a.data;
                return _this.onMessageCallback.execute(data);
            };
            this.socket.onerror = function (event) { return _this.onErrorCallback.execute(event.toString()); };
            this.socket.onclose = function (_a) {
                var code = _a.code, reason = _a.reason;
                return _this.onCloseCallback.execute({ code: code, reason: reason });
            };
        }
        Object.defineProperty(WebSocketAdapter.prototype, "state", {
            get: function () {
                return this.socket.readyState;
            },
            enumerable: true,
            configurable: true
        });
        WebSocketAdapter.prototype.send = function (message) {
            this.socket.send(message);
        };
        WebSocketAdapter.prototype.close = function (code, reason) {
            this.socket.close(code, reason);
        };
        return WebSocketAdapter;
    }());

    var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    function findObjectKeyForValue(object, value) {
        const keys = Object.keys(object);
        while (keys && keys.length > 0) {
            const key = keys.shift();
            if (object.hasOwnProperty(key) && object[key] === value) {
                return key;
            }
        }
        return null;
    }
    function valueBelongsToEnum(object, value) {
        return findObjectKeyForValue(object, value) !== null;
    }
    function uniqueValues(values) {
        const newSet = [];
        for (const entry of values) {
            if (newSet.indexOf(entry) === -1) {
                newSet.push(entry);
            }
        }
        return newSet;
    }

    var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    var CollectionAction;
    (function (CollectionAction) {
        CollectionAction[CollectionAction["Add"] = 0] = "Add";
        CollectionAction[CollectionAction["Remove"] = 1] = "Remove";
        CollectionAction[CollectionAction["Clear"] = 2] = "Clear";
        CollectionAction[CollectionAction["Commit"] = 3] = "Commit";
    })(CollectionAction || (CollectionAction = {}));

    var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    var TimePart;
    (function (TimePart) {
        TimePart["Date"] = "date";
        TimePart["Month"] = "month";
        TimePart["Year"] = "year";
        TimePart["Hours"] = "hours";
        TimePart["Minutes"] = "minutes";
        TimePart["Seconds"] = "seconds";
        TimePart["Epoch"] = "epoch";
    })(TimePart || (TimePart = {}));

    var MessageType;
    (function (MessageType) {
        MessageType[MessageType["Subscribe"] = 0] = "Subscribe";
        MessageType[MessageType["Unsubscribe"] = 1] = "Unsubscribe";
        MessageType[MessageType["PushToServer"] = 2] = "PushToServer";
        MessageType[MessageType["PushToClient"] = 3] = "PushToClient";
        MessageType[MessageType["RestoreRequest"] = 4] = "RestoreRequest";
        MessageType[MessageType["RestoreResponse"] = 5] = "RestoreResponse";
    })(MessageType || (MessageType = {}));

    var isArrayOfStrings = function (entry) { return Array.isArray(entry) && !entry.some(function (v) { return typeof v !== "string"; }); };

    function validateObject(value, configuration, allowExtraFields) {
        var e_1, _a;
        if (allowExtraFields === void 0) { allowExtraFields = false; }
        if (typeof value !== "object") {
            return { error: "Value is not an object: " + value };
        }
        var valueKeys = Object.keys(value);
        var _loop_1 = function (config) {
            var f = config.field, optional = config.optional, exactValue = config.exactValue, type = config.type, validator = config.validator, notEmpty = config.notEmpty, itemValidator = config.itemValidator;
            var field = f;
            var index = valueKeys.indexOf(field);
            if (index === -1) {
                if (optional) {
                    return "continue";
                }
                return { value: { field: field, error: "Field is missing" } };
            }
            var entryValue = value[field];
            if ('exactValue' in config && entryValue !== exactValue) {
                return { value: { field: field, error: "Exact value mismatch. Expected: " + exactValue + ", actual: " + entryValue } };
            }
            if (type) {
                if (isArrayOfStrings(type)) {
                    var uniqueTypes = uniqueValues(type);
                    if (!uniqueTypes.some(function (t) { return checkType(entryValue, t, notEmpty, itemValidator) === true; })) {
                        return { value: { field: field, error: "Type mismatch. Value didn't match any of [" + uniqueTypes + "] types allowed" } };
                    }
                }
                else {
                    var typeResult = checkType(entryValue, type, notEmpty, itemValidator);
                    if (typeResult !== true) {
                        return { value: __assign({ field: field }, typeResult) };
                    }
                }
            }
            if (validator && !validator(entryValue, field)) {
                return { value: { field: field, error: "Value " + entryValue + " disallowed by validator" } };
            }
            valueKeys.splice(index, 1);
        };
        try {
            for (var configuration_1 = __values(configuration), configuration_1_1 = configuration_1.next(); !configuration_1_1.done; configuration_1_1 = configuration_1.next()) {
                var config = configuration_1_1.value;
                var state_1 = _loop_1(config);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (configuration_1_1 && !configuration_1_1.done && (_a = configuration_1.return)) _a.call(configuration_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (valueKeys.length > 0 && !allowExtraFields) {
            return { error: "Extra, disallowed fields [" + valueKeys + "] encountered" };
        }
        return true;
    }
    function checkType(value, type, notEmpty, itemValidator) {
        if (type === "array") {
            if (!Array.isArray(value)) {
                return { error: "Type mismatch. Type is expected to be an array" };
            }
            if (notEmpty && !value.length) {
                return { error: "Array is empty." };
            }
            if (itemValidator) {
                if (value.some(function (entry) { return !itemValidator(entry); })) {
                    return { error: "Array item type mismatch." };
                }
            }
        }
        else if (type === "string[]") {
            if (!isArrayOfStrings(value)) {
                return { error: "Type mismatch. Type is expected to be an array of strings" };
            }
            if (notEmpty && !value.length) {
                return { error: "Array length mismatch - is empty." };
            }
            if (itemValidator) {
                if (value.some(function (entry) { return !itemValidator(entry); })) {
                    return { error: "Array item type mismatch." };
                }
            }
        }
        else {
            var actualType = typeof value;
            if (type !== actualType) {
                return { error: "Type mismatch. Expected: " + type + ", actual: " + actualType };
            }
            if (notEmpty && typeof value === "string" && !value.length) {
                return { error: "String length mismatch - is empty." };
            }
        }
        return true;
    }

    var MessageValidator = (function () {
        function MessageValidator(config) {
            var _this = this;
            this.config = config;
            this.validate = function (value) {
                var result = validateObject(value, _this.config);
                _this._lastValidationError = result === true ? null : result;
                return result === true;
            };
            this.serialize = function (value) {
                var _a = _this, validate = _a.validate, allFields = _a.allFields, fieldSerializers = _a.fieldSerializers;
                if (!validate(value)) {
                    return null;
                }
                return JSON.stringify(allFields.map(function (field) {
                    if (fieldSerializers.has(field)) {
                        var entrySerializer = fieldSerializers.get(field);
                        var type = _this.configMap.get(field).type;
                        if (type === "array" || type === "string[]") {
                            return value[field].map(entrySerializer);
                        }
                        return entrySerializer(value[field]);
                    }
                    return value[field];
                }));
            };
            this.deserialize = function (value) {
                var _a = _this, allFields = _a.allFields, fieldDeserializers = _a.fieldDeserializers, configMap = _a.configMap;
                var data;
                if (typeof value === "string") {
                    try {
                        data = JSON.parse(value);
                    }
                    catch (e) {
                        console.log("Error while deserialize", { value: value, e: e });
                        return null;
                    }
                }
                else {
                    data = value;
                }
                if (!Array.isArray(data) || data.length != allFields.length) {
                    console.log("Error while deserialize - not enough fields", value);
                    return null;
                }
                var parsed = {};
                allFields.forEach(function (field) {
                    var rawValue = data.shift();
                    var parsedValue;
                    if (fieldDeserializers.has(field)) {
                        var entryDeserializer = fieldDeserializers.get(field);
                        var type = _this.configMap.get(field).type;
                        if (type === "array" || type === "string[]") {
                            parsedValue = rawValue.map(entryDeserializer);
                        }
                        else {
                            parsedValue = entryDeserializer(rawValue);
                        }
                    }
                    else {
                        parsedValue = rawValue;
                    }
                    if (Array.isArray(parsedValue) && configMap.get(field).unique) {
                        parsed[field] = uniqueValues(parsedValue);
                    }
                    else if (parsedValue !== null || !configMap.get(field).optional) {
                        parsed[field] = parsedValue;
                    }
                });
                if (_this.validate(parsed)) {
                    return parsed;
                }
                console.log("Error while deserialize - validation has failed", { value: value, parsed: parsed });
                return null;
            };
            var allFields = [];
            var requiredFields = [];
            var configMap = new Map();
            var fieldSerializers = new Map();
            var fieldDeserializers = new Map();
            config.map(function (value) {
                var field = value.field, optional = value.optional;
                configMap.set(field, value);
                if (value.itemSerializer) {
                    fieldSerializers.set(field, value.itemSerializer);
                }
                if (value.itemDeserializer) {
                    fieldDeserializers.set(field, value.itemDeserializer);
                }
                return { field: field, optional: optional };
            }).forEach(function (_a) {
                var field = _a.field, optional = _a.optional;
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
        Object.defineProperty(MessageValidator.prototype, "lastValidationError", {
            get: function () {
                return this._lastValidationError;
            },
            enumerable: true,
            configurable: true
        });
        return MessageValidator;
    }());

    var pushToClientUtil = new MessageValidator([
        { field: "type", exactValue: MessageType.PushToClient },
        { field: "time", type: "number" },
        { field: "messageId", type: "string" },
        { field: "payload", type: "string" },
        { field: "channels", type: "string[]", optional: true }
    ]);

    var cachedMessageUtil = new MessageValidator([
        { field: "time", type: "number" },
        { field: "messageId", type: "string" },
        { field: "channels", type: "string[]" },
        { field: "payload", type: "string" }
    ]);

    var restoreResponseUtil = new MessageValidator([
        { field: "type", exactValue: MessageType.RestoreResponse },
        {
            field: "payload",
            type: "array",
            itemValidator: cachedMessageUtil.validate,
            itemSerializer: cachedMessageUtil.serialize,
            itemDeserializer: cachedMessageUtil.deserialize,
        }
    ]);

    var deserializeServerMessage = function (value) {
        var rawData;
        try {
            rawData = JSON.parse(value);
        }
        catch (e) {
            console.log("Error while deserialize ServerMessage", { value: value, e: e });
            return null;
        }
        if (!Array.isArray(rawData) || !rawData.length || !valueBelongsToEnum(MessageType, rawData[0])) {
            console.log("Error while deserialize ServerMessage 2 ", rawData);
            return null;
        }
        var type = rawData[0];
        if (type === MessageType.PushToClient) {
            return pushToClientUtil.deserialize(rawData);
        }
        if (type === MessageType.RestoreResponse) {
            return restoreResponseUtil.deserialize(rawData);
        }
        return null;
    };

    var subscribeMessageUtil = new MessageValidator([
        { field: "type", exactValue: MessageType.Subscribe },
        { field: "channels", type: "string[]", unique: true }
    ]);

    var unsubscribeMessageUtil = new MessageValidator([
        { field: "type", exactValue: MessageType.Unsubscribe },
        { field: "channels", type: "string[]" }
    ]);

    var cacheFilterUtil = new MessageValidator([
        { field: "maxAge", type: "number", optional: true, itemValidator: function (value) { return value > 0; } },
        { field: "maxLength", type: "number", optional: true, itemValidator: function (value) { return value > 0; } },
        { field: "messageId", type: "string", optional: true, notEmpty: true },
    ]);

    var restoreTargetUtil = new MessageValidator([
        { field: "channel", type: "string" },
        { field: "filter", optional: true, type: "object",
            itemValidator: cacheFilterUtil.validate,
            itemSerializer: cacheFilterUtil.serialize,
            itemDeserializer: cacheFilterUtil.deserialize,
        },
    ]);
    var restoreRequestUtil = new MessageValidator([
        { field: "type", exactValue: MessageType.RestoreRequest },
        {
            field: "channels",
            type: "array",
            itemValidator: function (value) { return restoreTargetUtil.validate(value); }
        }
    ]);

    var globalMessageChannel = "/";

    var pushToServerUtil = new MessageValidator([
        { field: "type", exactValue: MessageType.PushToServer },
        { field: "channels", type: "string[]", unique: true },
        { field: "payload", type: "string" }
    ]);

    var SocketClient = (function () {
        function SocketClient(connection) {
            var _this = this;
            /**
             * @private
             */
            this.connection = connection;
            this.onMessageCallback = new CallbackCollection();
            this.onRestoreCallback = new CallbackCollection();
            this.errorHandler = function (error) {
                console.error("Connection error:", error);
            };
            this.messageHandler = function (data) {
                var _a = _this, onMessageCallback = _a.onMessageCallback, onRestoreCallback = _a.onRestoreCallback;
                var message = deserializeServerMessage(data);
                switch (message.type) {
                    case MessageType.PushToClient:
                        onMessageCallback.execute(message);
                        break;
                    case MessageType.RestoreResponse:
                        onRestoreCallback.execute(message);
                        break;
                    default:
                        console.error("Message of unknown type received:", message);
                }
            };
            this.onMessage = this.onMessageCallback.manage;
            this.onRestore = this.onRestoreCallback.manage;
            connection.onError(this.errorHandler);
            connection.onMessage(this.messageHandler);
        }
        SocketClient.prototype.subscribe = function () {
            var channels = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                channels[_i] = arguments[_i];
            }
            this.connection.send(subscribeMessageUtil.serialize({ type: MessageType.Subscribe, channels: channels }));
        };
        SocketClient.prototype.unsubscribe = function () {
            var channels = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                channels[_i] = arguments[_i];
            }
            this.connection.send(unsubscribeMessageUtil.serialize({ type: MessageType.Unsubscribe, channels: channels }));
        };
        SocketClient.prototype.restore = function () {
            var channels = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                channels[_i] = arguments[_i];
            }
            this.connection.send(restoreRequestUtil.serialize({ type: MessageType.RestoreRequest, channels: channels }));
        };
        SocketClient.prototype.sendGlobalMessage = function (data) {
            this.sendChannelMessage(data, globalMessageChannel);
        };
        SocketClient.prototype.sendChannelMessage = function (data) {
            var channels = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                channels[_i - 1] = arguments[_i];
            }
            this.connection.send(pushToServerUtil.serialize({
                type: MessageType.PushToServer,
                channels: channels,
                payload: data
            }));
        };
        SocketClient.prototype.close = function () {
            this.connection.close();
        };
        return SocketClient;
    }());
    ["connection", "onMessageCallback", "onRestoreCallback", "errorHandler", "messageHandler"].forEach(function (prop) {
        return Object.defineProperty(SocketClient, prop, {
            enumerable: false,
            writable: false
        });
    });

    var createClient = function (url) { return new SocketClient(new WebSocketAdapter(url)); };
    var version = "1.0.0";

    exports.createClient = createClient;
    exports.version = version;

    return exports;

}({}));
//# sourceMappingURL=webClient.js.map
