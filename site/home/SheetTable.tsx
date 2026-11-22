import { useEffect, useRef, useState, type ReactElement } from 'react';
import { STATUSES, columnIndex, type Status } from '@/lib/tracker/columns';
import { demoStore } from '../demo/install';
import { SHEET_COLUMNS, type SheetEntry } from '../demo/state';

const MIN_ROWS = 20;
const FRESH_MS = 1800;

function useFreshRows(rows: readonly SheetEntry[]): ReadonlySet<string> {
  const known = useRef(new Set(rows.map((entry) => entry.jobId)));
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    const added = rows
      .filter((entry) => !known.current.has(entry.jobId))
      .map((e) => e.jobId);
    known.current = new Set(rows.map((entry) => entry.jobId));
    if (added.length === 0) {
      return;
    }
    setFresh((current) => new Set([...current, ...added]));
    setTimeout(() => {
      setFresh(
        (current) => new Set([...current].filter((id) => !added.includes(id))),
      );
    }, FRESH_MS);
  }, [rows]);
  return fresh;
}

export function SheetTable(props: {
  readonly rows: readonly SheetEntry[];
}): ReactElement {
  const statusAt = columnIndex('Status');
  const fresh = useFreshRows(props.rows);
  const blanks = Math.max(0, MIN_ROWS - props.rows.length);
  return (
    <div className="sheet">
      <div className="sheet-scroll">
        <table aria-label="Job tracker sheet">
          <thead>
            <tr>
              <th scope="col" className="rownum">
                1
              </th>
              {SHEET_COLUMNS.map((column) => (
                <th key={column} scope="col" data-col={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((entry, at) => (
              <tr
                key={entry.jobId}
                data-job={entry.jobId}
                data-fresh={fresh.has(entry.jobId)}
              >
                <th scope="row" className="rownum">
                  {at + 2}
                </th>
                {entry.row.map((cell, index) =>
                  index === statusAt ? (
                    <td key={SHEET_COLUMNS[index]} data-col="Status">
                      <select
                        aria-label="Status"
                        value={String(cell)}
                        onChange={(event) =>
                          demoStore.setRowStatus(
                            entry.jobId,
                            event.target.value as Status,
                          )
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  ) : (
                    <td
                      key={SHEET_COLUMNS[index]}
                      data-col={SHEET_COLUMNS[index]}
                    >
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
            {Array.from({ length: blanks }, (_, at) => (
              <tr key={`blank-${at}`} aria-hidden="true">
                <th scope="row" className="rownum">
                  {props.rows.length + at + 2}
                </th>
                {SHEET_COLUMNS.map((column) => (
                  <td key={column} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {props.rows.length === 0 ? (
        <p className="sheet-empty">
          Apply to a job in the Jobs tab and it lands here as a row.
        </p>
      ) : null}
    </div>
  );
}
