import React, { useCallback, useEffect, useMemo, useState } from "react";

import "./App.css";

type clickedObj = {
  row: number | null;
  col: number | null;
};

type changedObj = {
  row: number;
  col: number;
  number: number;
};

// Get the last value of 3 consecutive numbers by one of them
function getLastValue(value: number) {
  return 3 * Math.ceil((value + 1) / 3);
}

function createArrayWithValue(value: number) {
  return Array.from({ length: 3 }, (_, i) => getLastValue(value) - 3 + i * 1);
}

function checkBelongToBox(row: number, col: number, i: number, j: number) {
  const rowArr = createArrayWithValue(row);
  const colArr = createArrayWithValue(col);

  return rowArr.includes(i) && colArr.includes(j);
}

function shuffle(array: Array<number>) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
}

function check(
  array: Array<Array<number>>,
  number: number,
  row: number,
  col: number
) {
  //check row
  for (let i = 0; i < 9; i++) {
    if (array[row][i] === number) {
      return false;
    }
  }

  // check column
  for (let i = 0; i < 9; i++) {
    if (array[i][col] === number) {
      return false;
    }
  }

  // check box
  const lastRow = getLastValue(row);
  const lastCol = getLastValue(col);
  for (let i = lastRow - 3; i < lastRow; i++) {
    for (let j = lastCol - 3; j < lastCol; j++) {
      if (array[i][j] === number) {
        return false;
      }
    }
  }

  return true;
}

function fillRemain(array: Array<Array<number>>, row: number, col: number) {
  if (row === 8 && col === 9) {
    return true;
  }

  if (col === 9) {
    col = 0;
    row += 1;
  }

  const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let i = 0; i < numbers.length; i++) {
    const number = numbers[i];
    if (check(array, number, row, col)) {
      array[row][col] = number;
      if (fillRemain(array, row, col + 1)) {
        return true;
      }
      array[row][col] = 0;
    }
  }

  return false;
}

function App() {
  const [newGame, setNewGame] = useState<number>(0);
  const [level, setLevel] = useState<number>(40);
  const [changed, setChanged] = useState<Array<changedObj>>([]);
  const [clicked, setClicked] = useState<clickedObj>({ row: null, col: null });

  const completedSudoku = useMemo(() => {
    const array = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => 0 * newGame)
    );

    // fill first row
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < 9; i++) {
      const number = numbers[Math.floor(Math.random() * numbers.length)];
      numbers.splice(numbers.indexOf(number), 1);
      array[0][i] = number;
    }

    // fill other row
    fillRemain(array, 1, 0);

    return array;
  }, [newGame]);

  const hiddenSudoku = useMemo(() => {
    // clone new sudoku array
    const array = completedSudoku.map(function (arr) {
      return arr.slice();
    });
    let k = level;
    while (k > 0) {
      const i = Math.floor(Math.random() * 9);
      const j = Math.floor(Math.random() * 9);
      if (array[i][j] !== 0) {
        array[i][j] = 0;
        k--;
      }
    }

    return array;
  }, [completedSudoku, level]);

  const board = useMemo(() => {
    const array = hiddenSudoku.map(function (arr) {
      return arr.slice();
    });

    changed.forEach((obj) => {
      const { row, col, number } = obj;
      array[row][col] = number;
    });

    return array;
  }, [hiddenSudoku, changed]);

  function handleOnClick(row: number, col: number) {
    setClicked({ ...clicked, row, col });
  }

  function handleChangeLevel(value: number) {
    setNewGame(newGame + 1);
    setLevel(value);
  }

  const handleSetNewGame = useCallback(() => {
    setChanged([]);
    setClicked({ row: null, col: null });
    setNewGame(newGame + 1);
  }, [newGame]);

  function handleReset() {
    setChanged([]);
    setClicked({ row: null, col: null });
  }

  const handleSetChanged = useCallback(
    (row: number, col: number, number: number) => {
      if (hiddenSudoku[row][col] === 0) {
        const filterChanged = changed.filter(
          (value) => value.row !== row || value.col !== col
        );
        filterChanged.push({ row, col, number });
        setChanged(filterChanged);
      }
    },
    [changed, hiddenSudoku]
  );

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      const { row, col } = clicked;
      if (row !== null && col !== null) {
        let number = 0;
        if (e.code.indexOf("Digit") !== -1) {
          number = parseInt(e.code.replace("Digit", ""));
        }
        if (e.code.indexOf("Numpad") !== -1) {
          number = parseInt(e.code.replace("Numpad", ""));
        }

        if (number > 0) {
          handleSetChanged(row, col, number);
        }
      }
    }

    document.addEventListener("keyup", handleKeyPress);

    return () => {
      document.removeEventListener("keyup", handleKeyPress);
    };
  }, [clicked, handleSetChanged]);

  useEffect(() => {
    let correct = 0;
    changed.forEach((obj) => {
      const { row, col, number } = obj;
      if (completedSudoku[row][col] === number) {
        correct += 1;
      }
    });

    if (correct === level) {
      handleSetNewGame();
      alert("You win!!!");
    }
  }, [changed, completedSudoku, level, handleSetNewGame]);

  const { row, col } = clicked;

  const boardHtml = board.map((arr, i) =>
    arr.map((value, j) => {
      const className = [];
      if ((i + 1) % 3 === 0) className.push("three-row");
      if ((j + 1) % 3 === 0) className.push("three-col");
      if (i === row) className.push("row-selected");
      if (j === col) className.push("col-selected");
      if (i === row && j === col) className.push("selected");
      // check box
      if (row !== null && col !== null && checkBelongToBox(row, col, i, j)) {
        className.push("box-selected");
      }
      // check wrong or correct
      if (hiddenSudoku[i][j] === 0 && value > 0) {
        if (value !== completedSudoku[i][j]) className.push("wrong");
        if (completedSudoku[i][j] === value) className.push("correct");
      }
      // check same value
      if (
        row !== null &&
        col !== null &&
        (row !== i || col !== j) &&
        value > 0 &&
        board[row][col] === value
      ) {
        className.push("same");
        if (board[row][col] !== completedSudoku[row][col]) {
          if (i === row) className.push("same-wrong");
          if (j === col) className.push("same-wrong");
          if (
            checkBelongToBox(row, col, i, j) &&
            !className.includes("same-wrong")
          ) {
            className.push("same-wrong");
          }
        }
      }

      return (
        <div
          key={i + j}
          onClick={() => handleOnClick(i, j)}
          className={`square ${className.join(" ")}`}
        >
          {value || ""}
        </div>
      );
    })
  );

  const selecteNumbers =
    row !== null && col !== null
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => {
          return (
            <div
              className="number"
              onClick={() => handleSetChanged(row, col, number)}
            >
              {number}
            </div>
          );
        })
      : null;

  return (
    <div className="container">
      <h1 className="title">Sudoku</h1>
      <div className="difficult">
        <label>Difficult:</label>
        <button
          className={`btn ${level === 20 ? "selected" : ""}`}
          onClick={() => handleChangeLevel(20)}
        >
          Easy
        </button>
        <button
          className={`btn ${level === 40 ? "selected" : ""}`}
          onClick={() => handleChangeLevel(40)}
        >
          Normal
        </button>
        <button
          className={`btn ${level === 60 ? "selected" : ""}`}
          onClick={() => handleChangeLevel(60)}
        >
          Hard
        </button>
      </div>
      <div className="squares">{boardHtml}</div>
      <div className="numbers">{selecteNumbers}</div>
      <div className="actions">
        <button className="btn" onClick={() => handleSetNewGame()}>
          New Game
        </button>
        <button className="btn" onClick={() => handleReset()}>
          Reset
        </button>
        <button
          className="btn"
          onClick={() => {
            if (row !== null && col !== null) {
              handleSetChanged(row, col, 0);
            }
          }}
        >
          Delete
        </button>
        <button
          className="btn"
          onClick={() => {
            if (row !== null && col !== null) {
              handleSetChanged(row, col, completedSudoku[row][col]);
            }
          }}
        >
          Hint
        </button>
      </div>
    </div>
  );
}

export default App;
