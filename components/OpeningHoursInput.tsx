"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  DayOfWeek,
  OpeningHoursState,
  TimeRange,
  DaySchedule,
} from "@/types/opening-hours";
import {
  parseOpeningHours,
  generateOpeningHours,
  validateOpeningHours,
  createDefaultOpeningHoursState,
  applyPreset,
  getDayName,
  DAYS_OF_WEEK,
} from "@/lib/opening-hours-utils";
import { ChevronDown, ChevronUp, Plus, X, AlertCircle } from "lucide-react";

interface OpeningHoursInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  id?: string;
  name?: string;
}

export default function OpeningHoursInput({
  value = "",
  onChange,
  onBlur,
  error,
  id,
  name,
}: OpeningHoursInputProps) {
  const [state, setState] = useState<OpeningHoursState>(() => {
    if (value) {
      try {
        return parseOpeningHours(value);
      } catch {
        return createDefaultOpeningHoursState();
      }
    }
    return createDefaultOpeningHoursState();
  });

  // Always start in visual mode, never advanced mode
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);
  const [advancedText, setAdvancedText] = useState(value);
  const [showSpecialRules, setShowSpecialRules] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  
  // Track if this is the initial render to avoid calling onChange during render
  const isInitialMount = useRef(true);
  const lastValueRef = useRef(value);
  const pendingOnChangeRef = useRef<string | null>(null);

  // Update state when value prop changes (from external source)
  useEffect(() => {
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      if (value) {
        try {
          const parsed = parseOpeningHours(value);
          const generated = generateOpeningHours(parsed);
          setState(parsed);
          setAdvancedText(value);
          // Update validation but don't call onChange (value came from parent)
          setValidationResult(validateOpeningHours(generated));
        } catch {
          // Invalid value, keep current state
        }
      }
    }
  }, [value]);

  // Generate opening hours string and update validation
  const updateOpeningHours = useCallback(
    (newState: OpeningHoursState) => {
      const osmString = generateOpeningHours(newState);
      setValidationResult(validateOpeningHours(osmString));
      // Store pending onChange to be called in useEffect (after render)
      if (!isInitialMount.current && osmString !== value) {
        pendingOnChangeRef.current = osmString;
      }
    },
    [value]
  );

  // Call onChange after render completes (via useEffect)
  useEffect(() => {
    if (pendingOnChangeRef.current !== null && !isInitialMount.current) {
      const valueToNotify = pendingOnChangeRef.current;
      pendingOnChangeRef.current = null;
      onChange?.(valueToNotify);
    }
  });

  // Update state and notify parent
  const updateState = useCallback(
    (updater: (prev: OpeningHoursState) => OpeningHoursState) => {
      setState((prev) => {
        const newState = updater(prev);
        updateOpeningHours(newState);
        return newState;
      });
    },
    [updateOpeningHours]
  );

  // Mark initial mount as complete after first render
  useEffect(() => {
    isInitialMount.current = false;
    // Ensure advanced mode is false on initial load
    setAdvancedMode(false);
    // Validate initial value after mount
    if (value) {
      const validation = validateOpeningHours(value);
      setValidationResult(validation);
    }
  }, []);

  // Handle preset selection
  const handlePreset = (preset: "mon-fri-9-5" | "mon-sat-9-5" | "24-7" | "closed" | "weekends-only") => {
    updateState((prev) => ({
      ...prev,
      weekSchedule: applyPreset(preset, prev.weekSchedule),
    }));
  };

  // Toggle day enabled/disabled
  const toggleDay = (day: DayOfWeek) => {
    updateState((prev) => {
      const schedule = prev.weekSchedule[day];
      return {
        ...prev,
        weekSchedule: {
          ...prev.weekSchedule,
          [day]: {
            ...schedule,
            enabled: !schedule.enabled,
            closed: false,
            timeRanges: schedule.enabled ? [] : [{ open: "09:00", close: "17:00" }],
          },
        },
      };
    });
  };

  // Toggle day closed
  const toggleDayClosed = (day: DayOfWeek) => {
    updateState((prev) => {
      const schedule = prev.weekSchedule[day];
      return {
        ...prev,
        weekSchedule: {
          ...prev.weekSchedule,
          [day]: {
            ...schedule,
            closed: !schedule.closed,
            timeRanges: schedule.closed ? [{ open: "09:00", close: "17:00" }] : [],
          },
        },
      };
    });
  };

  // Update time range
  const updateTimeRange = (
    day: DayOfWeek,
    rangeIndex: number,
    field: "open" | "close",
    time: string
  ) => {
    updateState((prev) => {
      const schedule = prev.weekSchedule[day];
      const newRanges = [...schedule.timeRanges];
      if (newRanges[rangeIndex]) {
        newRanges[rangeIndex] = {
          ...newRanges[rangeIndex],
          [field]: time,
        };
      }
      return {
        ...prev,
        weekSchedule: {
          ...prev.weekSchedule,
          [day]: {
            ...schedule,
            timeRanges: newRanges,
          },
        },
      };
    });
  };

  // Add time range
  const addTimeRange = (day: DayOfWeek) => {
    updateState((prev) => {
      const schedule = prev.weekSchedule[day];
      return {
        ...prev,
        weekSchedule: {
          ...prev.weekSchedule,
          [day]: {
            ...schedule,
            timeRanges: [...schedule.timeRanges, { open: "09:00", close: "17:00" }],
          },
        },
      };
    });
  };

  // Remove time range
  const removeTimeRange = (day: DayOfWeek, rangeIndex: number) => {
    updateState((prev) => {
      const schedule = prev.weekSchedule[day];
      return {
        ...prev,
        weekSchedule: {
          ...prev.weekSchedule,
          [day]: {
            ...schedule,
            timeRanges: schedule.timeRanges.filter((_, i) => i !== rangeIndex),
          },
        },
      };
    });
  };

  // Handle advanced mode text change
  const handleAdvancedTextChange = (text: string) => {
    setAdvancedText(text);
    const validation = validateOpeningHours(text);
    setValidationResult(validation);
    
    if (validation.valid) {
      try {
        const parsed = parseOpeningHours(text);
        setState(parsed);
        // Store pending onChange to be called in useEffect
        if (!isInitialMount.current && text !== value) {
          pendingOnChangeRef.current = text;
        }
      } catch {
        // Invalid, but don't update state
      }
    }
  };

  // Switch to advanced mode
  const switchToAdvanced = () => {
    const currentString = generateOpeningHours(state);
    setAdvancedText(currentString);
    setAdvancedMode(true);
  };

  // Switch back to visual mode
  const switchToVisual = () => {
    try {
      const parsed = parseOpeningHours(advancedText);
      setState(parsed);
      setAdvancedMode(false);
      onChange?.(advancedText);
    } catch {
      // Invalid, keep in advanced mode
      setValidationResult({
        valid: false,
        errors: ["Invalid opening hours format. Please check the syntax."],
        warnings: [],
      });
    }
  };

  const currentOpeningHours = advancedMode
    ? advancedText
    : generateOpeningHours(state);

  return (
    <div className="space-y-4" id={id}>
      {/* Presets */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick presets for opening hours">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handlePreset("mon-fri-9-5")}
          aria-label="Apply Monday to Friday 9 AM to 5 PM preset"
          className="touch-manipulation"
        >
          Mon-Fri 9-5
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handlePreset("mon-sat-9-5")}
          aria-label="Apply Monday to Saturday 9 AM to 5 PM preset"
          className="touch-manipulation"
        >
          Mon-Sat 9-5
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handlePreset("24-7")}
          aria-label="Apply 24/7 preset"
          className="touch-manipulation"
        >
          24/7
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handlePreset("weekends-only")}
          aria-label="Apply weekends only preset"
          className="touch-manipulation"
        >
          Weekends Only
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handlePreset("closed")}
          aria-label="Apply closed preset"
          className="touch-manipulation"
        >
          Closed
        </Button>
      </div>

      {/* Mode Toggle - Hidden on mobile */}
      <div className="hidden md:flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={advancedMode ? switchToVisual : switchToAdvanced}
          aria-label={advancedMode ? "Switch to visual mode" : "Switch to advanced mode"}
          className="touch-manipulation"
        >
          {advancedMode ? "Visual Mode" : "Advanced Mode"}
        </Button>
      </div>

      {advancedMode ? (
        /* Advanced Mode - Text Editor - Hidden on mobile */
        <div className="hidden md:block space-y-2">
          <Label htmlFor={`${id}-advanced`}>Opening Hours (OSM Format)</Label>
          <Textarea
            id={`${id}-advanced`}
            name={name}
            value={advancedText}
            onChange={(e) => handleAdvancedTextChange(e.target.value)}
            onBlur={onBlur}
            rows={4}
            className={error || (validationResult && !validationResult.valid) ? "border-red-500" : ""}
            aria-describedby={
              error || (validationResult && !validationResult.valid)
                ? `${id}-error ${id}-advanced-help`
                : `${id}-advanced-help`
            }
            aria-invalid={error || (validationResult && !validationResult.valid) ? "true" : "false"}
            placeholder="Mo-Fr 09:00-17:00; Sa 09:00-12:00"
          />
          <p id={`${id}-advanced-help`} className="text-xs text-neutral-dark">
            Enter opening hours in{" "}
            <a
              href="https://wiki.openstreetmap.org/wiki/Key:opening_hours/specification"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              OSM opening_hours format
            </a>
            . Example: <code className="bg-neutral-light px-1 rounded">Mo-Fr 09:00-17:00</code>
          </p>
          {validationResult && !validationResult.valid && (
            <div
              id={`${id}-error`}
              className="flex items-start gap-2 text-sm text-red-600"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Validation errors:</p>
                <ul className="list-disc list-inside mt-1">
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Visual Mode - Weekly Calendar */
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full min-w-[600px]" role="table" aria-label="Weekly opening hours schedule">
                  <thead className="bg-neutral-light">
                    <tr>
                      <th scope="col" className="px-2 md:px-4 py-2 text-left text-sm font-medium">Day</th>
                      <th scope="col" className="px-2 md:px-4 py-2 text-left text-sm font-medium">Open</th>
                      <th scope="col" className="px-2 md:px-4 py-2 text-left text-sm font-medium">Hours</th>
                      <th scope="col" className="px-2 md:px-4 py-2 text-left text-sm font-medium">Closed</th>
                    </tr>
                  </thead>
                <tbody>
                  {DAYS_OF_WEEK.map((day) => {
                    const schedule = state.weekSchedule[day];
                    return (
                      <tr
                        key={day}
                        className="border-t hover:bg-neutral-light/50 transition-colors"
                      >
                        <td className="px-2 md:px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`${id}-${day}-enabled`}
                              checked={schedule.enabled}
                              onCheckedChange={() => toggleDay(day)}
                              aria-label={`Toggle ${getDayName(day)}`}
                              aria-describedby={`${id}-${day}-status`}
                            />
                            <Label
                              htmlFor={`${id}-${day}-enabled`}
                              className="font-medium cursor-pointer"
                            >
                              {getDayName(day)}
                            </Label>
                          </div>
                        </td>
                        <td id={`${id}-${day}-status`} className="px-2 md:px-4 py-3">
                          {schedule.enabled && !schedule.closed && (
                            <span className="text-sm text-green-600 font-medium">Open</span>
                          )}
                          {schedule.enabled && schedule.closed && (
                            <span className="text-sm text-red-600 font-medium">Closed</span>
                          )}
                          {!schedule.enabled && (
                            <span className="text-sm text-neutral-dark">—</span>
                          )}
                        </td>
                        <td className="px-2 md:px-4 py-3">
                          {schedule.enabled && !schedule.closed && (
                            <div className="space-y-2">
                              {schedule.timeRanges.map((range, rangeIndex) => (
                                <div
                                  key={rangeIndex}
                                  className="flex items-center gap-2 flex-wrap"
                                >
                                  <Input
                                    type="time"
                                    value={range.open}
                                    onChange={(e) =>
                                      updateTimeRange(day, rangeIndex, "open", e.target.value)
                                    }
                                    className="w-full sm:w-32"
                                    aria-label={`${getDayName(day)} opening time ${rangeIndex + 1}`}
                                    aria-describedby={`${id}-${day}-range-${rangeIndex}`}
                                  />
                                  <span className="text-neutral-dark sr-only sm:not-sr-only">to</span>
                                  <Input
                                    type="time"
                                    value={range.close}
                                    onChange={(e) =>
                                      updateTimeRange(day, rangeIndex, "close", e.target.value)
                                    }
                                    className="w-full sm:w-32"
                                    aria-label={`${getDayName(day)} closing time ${rangeIndex + 1}`}
                                    aria-describedby={`${id}-${day}-range-${rangeIndex}`}
                                  />
                                  <span id={`${id}-${day}-range-${rangeIndex}`} className="sr-only">
                                    Time range {rangeIndex + 1} for {getDayName(day)}
                                  </span>
                                  {schedule.timeRanges.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTimeRange(day, rangeIndex)}
                                      aria-label={`Remove time range ${rangeIndex + 1} for ${getDayName(day)}`}
                                      className="h-8 w-8 p-0 touch-manipulation"
                                    >
                                      <X className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addTimeRange(day)}
                                aria-label={`Add another time range for ${getDayName(day)}`}
                                className="text-xs touch-manipulation"
                              >
                                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                                <span className="sr-only sm:not-sr-only">Add Break</span>
                                <span className="sm:sr-only">Add</span>
                              </Button>
                            </div>
                          )}
                          {schedule.enabled && schedule.closed && (
                            <span className="text-sm text-neutral-dark">Closed all day</span>
                          )}
                          {!schedule.enabled && (
                            <span className="text-sm text-neutral-dark">Not set</span>
                          )}
                        </td>
                        <td className="px-2 md:px-4 py-3">
                          {schedule.enabled && (
                            <Checkbox
                              id={`${id}-${day}-closed`}
                              checked={schedule.closed}
                              onCheckedChange={() => toggleDayClosed(day)}
                              aria-label={`Mark ${getDayName(day)} as closed`}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Rules Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => setShowSpecialRules(!showSpecialRules)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation"
          aria-expanded={showSpecialRules}
          aria-controls={`${id}-special-rules`}
        >
          <span className="font-medium">Special Rules (Holidays, Dates, Comments)</span>
          {showSpecialRules ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        {showSpecialRules && (
          <div id={`${id}-special-rules`} className="p-4 space-y-4 border-t">
            <div>
              <Label htmlFor={`${id}-comment`}>Comments/Notes</Label>
              <Textarea
                id={`${id}-comment`}
                value={state.comment || ""}
                onChange={(e) =>
                  updateState((prev) => ({ ...prev, comment: e.target.value }))
                }
                rows={2}
                placeholder='e.g., "Call ahead for appointments"'
                aria-describedby={`${id}-comment-help`}
              />
              <p id={`${id}-comment-help`} className="text-xs text-neutral-dark mt-1">
                Optional comments that will be included in the opening hours string
              </p>
            </div>
            <div className="text-sm text-neutral-dark">
              <p>
                For public holidays and date-specific rules, use Advanced Mode or edit the
                generated opening hours string directly.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label>Preview (OSM Format)</Label>
        <div className="bg-neutral-light p-3 rounded-md border">
          <code className="text-sm font-mono break-all">
            {currentOpeningHours || "(empty)"}
          </code>
        </div>
        {validationResult && !validationResult.valid && (
          <div
            className="flex items-start gap-2 text-sm text-red-600"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Validation errors:</p>
              <ul className="list-disc list-inside mt-1">
                {validationResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {validationResult && validationResult.valid && validationResult.warnings && validationResult.warnings.length > 0 && (
          <div
            className="flex items-start gap-2 text-sm text-amber-600"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Warnings:</p>
              <ul className="list-disc list-inside mt-1">
                {validationResult.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
          {validationResult && validationResult.valid && validationResult.warnings && validationResult.warnings.length > 0 && (
            <div
              className="flex items-start gap-2 text-sm text-amber-600"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Warnings:</p>
                <ul className="list-disc list-inside mt-1">
                  {validationResult.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={currentOpeningHours} />
    </div>
  );
}

