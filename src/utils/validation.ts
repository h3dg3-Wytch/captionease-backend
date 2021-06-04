import Joi from 'joi';

export const validate = (value: any, schema: Joi.Schema) => {
  const result = Joi.validate(value, schema);
  if (result.error) {
    throw result.error;
  }
};

export default Joi;
