import {addLeadingZero} from "../../../util";
import {timeToObject} from "ugd10a";

export const createLogFileName = (type: string, time: Date = new Date()): string => {
    const {year, month, date} = timeToObject(time);
    return `${year}-${[month, date].map(v => addLeadingZero(v)).join('-')}-${type}.log`;
};

