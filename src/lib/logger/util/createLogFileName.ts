import {addLeadingZero, dateToMap} from "../../../util";

export const createLogFileName = (type: string, time: Date = new Date()): string => {
    const {year, month, date} = dateToMap(time).asObject();
    return `${year}-${[month, date].map(v => addLeadingZero(v)).join('-')}-${type}.log`;
};

