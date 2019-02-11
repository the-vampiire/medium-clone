const { extractFieldErrors } = require('../../../../controller-utils');

/**
 * Get the reader's story clap
 * @param {Request} req Request object
 * @param {Clap} req.pathClap the reader's story clap 
 * @param {Response} res Response object
 * @returns JSON response in Clap Response Shape
 */
const readerClapDiscoveryHandler = async (req, res) => {
  const { pathClap } = req;
  
  const responseData = await pathClap.toResponseShape();
  return res.json(responseData);
};

/**
 * Updates the count on a reader's story clap
 * - count is null: destroy the clap
 * - count between 1 and 50: updates the clap count
 * @param {Request} req Request object 
 * @param {Clap} req.pathClap the reader's story clap
 * @param {number | null} req.body.count the new count to update the clap
 * @param {Response} res Response object
 * @returns count null: 204 no content
 * @returns valid count: JSON response of updated clap in Clap Response Shape
 * @returns count missing: 400 JSON response { error }
 * @returns invalid count: 400 JSON response { error, fields }
 */
const updateReaderClapHandler = async (req, res) => {
  const { pathClap, body: { count } } = req;

  if (count === undefined) {
    return res.status(400).json({ error: 'clap count required' });
  }
  
  if (count === null) {
    await pathClap.destroy();
    return res.status(204);
  }
  
  let updatedClap;
  try {
    pathClap.count = count;
    updatedClap = await pathClap.save();
  } catch(validationError) {
    const fields = extractFieldErrors(validationError.errors);
    return res.status(400).json({ error: 'clap update validation failed', fields });
  }

  const responseData = await updatedClap.toResponseShape();
  
  return res.json(responseData);
};

module.exports = {
  readerClapDiscoveryHandler,
  updateReaderClapHandler,
};
