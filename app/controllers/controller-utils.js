/**
 * Extracts Mongo field errors from a Validation Error
 * @param {object} errors the errors object on the ValidationError instanc
 * @returns {object} a field errors object containing { field: errorMessage, ... }
 */
const extractFieldErrors = (errors) => {
  if (!errors) return {};

  return Object.keys(errors)
    .reduce((fieldErrors, field) => {
      fieldErrors[field] = errors[field].message;
      return fieldErrors
    }, {});
};

/**
 * Configures and returns a 201 JSON response for a created entity
 * - sets the Location header using the resource's links property
 * @required responseData.links for Location header
 * @param {object} responseData JSON response data in <Entity> Response Shape
 * @param {string} urlName the url property of the links object used for Location header
 * @param {Response} res Response object
 * @returns 201 JSON response
 */
const newResourceResponse = (responseData, urlName, res) => {
  res.set({ Location: responseData.links[urlName] });
  return res.status(201).json(responseData);
}

module.exports = {
  extractFieldErrors,
  newResourceResponse,
};
