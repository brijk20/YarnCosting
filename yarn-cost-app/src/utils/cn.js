const flatten = (input) => {
  if (!Array.isArray(input)) return [input]
  return input.reduce((acc, item) => acc.concat(flatten(item)), [])
}

const cn = (...values) =>
  flatten(values)
    .filter(Boolean)
    .join(" ")

export default cn
