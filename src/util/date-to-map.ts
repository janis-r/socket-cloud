/**
 * Transform date object into Map object representing Date object components
 * @param time
 */
export function dateToMap(time: Date) {
    const keys = [DatePart.Date, DatePart.Month, DatePart.Year, DatePart.Hours, DatePart.Minutes, DatePart.Seconds];
    const values = [
        time.getDate(),
        time.getMonth() + 1,
        time.getFullYear(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds()
    ];

    return new (class ExtendedMap extends Map<DatePart, number> {
        /**
         * Get date object representation as object
         */
        asObject(): DateObjectMap {
            const data: Partial<DateObjectMap> = {};
            [...this].forEach(([key, value]) => data[key] = value);
            return data as DateObjectMap;
        }
    })(keys.map((key, index): [DatePart, number] => ([key, values[index]])))
}

/**
 * Get current date map
 */
export const currentDateToMap = () => dateToMap(new Date());

type DateObjectMap = {
    [key in DatePart]: number
};

export enum DatePart {
    Date = "date",
    Month = "month",
    Year = "year",
    Hours = "hours",
    Minutes = "minutes",
    Seconds = "seconds"
}


