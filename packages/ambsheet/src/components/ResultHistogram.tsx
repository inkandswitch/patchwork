import { Value } from "../eval";
import { isNumber } from "lodash";
import { FilterSelection } from "./AmbSheet";
import { Position } from "../datatype";
import { Histogram } from "./Histogram";

import RangeSlider from "react-range-slider-input";
import "../range-slider.css";
import { useEffect, useMemo, useState } from "react";
import { printRawValue } from "../print";
import { ValueViewer, ValueViewerProps } from "./CellDetails";

type NumberRange = {
  min: number;
  max: number;
};

export const ResultHistogram = ({
  sheet,
  values,
  setFilterSelection,
}: ValueViewerProps) => {
  console.log("values", values);
  const numbers = useMemo(
    () => values.map((v) => v.value.rawValue).filter(isNumber),
    [values]
  );
  const filteredNumbers = values
    .filter((v) => v.include)
    .map((n) => n.value.rawValue)
    .filter(isNumber);

  const selectValuesBetween = (range: NumberRange | null) => {
    if (!range) {
      setFilterSelection(null);
    } else {
      const numbersToSelect = numbers.filter(
        (n) => n >= range.min && n < range.max
      );

      setFilterSelection(numbersToSelect);
    }
  };

  const numbersMin = useMemo(() => Math.min(...numbers), [numbers]);
  const numbersMax = useMemo(() => Math.max(...numbers), [numbers]);

  const [filterBarLimits, setFilterBarLimits] = useState<{
    min: number;
    max: number;
  }>({ min: numbersMin, max: numbersMax });

  useEffect(() => {
    setFilterBarLimits({ min: numbersMin, max: numbersMax });
  }, [numbersMin, numbersMax]);

  useEffect(() => {
    if (
      filterBarLimits.min === numbersMin &&
      filterBarLimits.max === numbersMax
    ) {
      selectValuesBetween(null);
    } else {
      selectValuesBetween(filterBarLimits);
    }
  }, [filterBarLimits]);

  if (numbers.length < 2) {
    return (
      <div className="text-gray-400 text-xs">
        Need at least two numbers to display a histogram
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-4 items-start">
      <div>
        <Histogram
          data={numbers}
          filteredData={filteredNumbers}
          width={200}
          height={100}
          selectValuesBetween={selectValuesBetween}
        />
        <div className="w-[200px] mt-2">
          <RangeSlider
            min={numbersMin - 0.01}
            max={numbersMax + 0.01}
            width={200}
            value={[filterBarLimits.min, filterBarLimits.max]}
            onInput={([min, max]) => setFilterBarLimits({ min, max })}
          />
        </div>
      </div>
      <table className="text-xs text-gray-500 w-full ">
        <tbody>
          <tr>
            <td className="font-medium">Count:</td>
            <td>{printRawValue(values.length)}</td>
          </tr>
          <tr>
            <td className="font-medium">Mean:</td>
            <td>
              {printRawValue(
                values
                  .map((v) => v.value.rawValue)
                  .filter(isNumber)
                  .reduce((acc, v) => acc + v, 0) / values.length
              )}
            </td>
          </tr>
          <tr>
            <td className="font-medium">Min:</td>
            <td>
              {printRawValue(
                Math.min(
                  ...values.map((v) => v.value.rawValue).filter(isNumber)
                )
              )}
            </td>
          </tr>
          <tr>
            <td className="font-medium">Max:</td>
            <td>
              {printRawValue(
                Math.max(
                  ...values.map((v) => v.value.rawValue).filter(isNumber)
                )
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const histogramViewer: ValueViewer = {
  name: "Histogram",
  shouldRender: (values) =>
    values.length > 10 ? "high" : values.length > 1 ? "normal" : "hide",
  component: ResultHistogram,
};
