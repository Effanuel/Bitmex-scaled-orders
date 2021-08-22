import React from 'react';
import {Box, NumberInput, NumberInputField, Input} from '@chakra-ui/react';
import './InputField.module.scss';

interface Props {
  testID?: string;
  id?: string;
  label?: string;
  value: any;
  stop?: boolean;
  placeholder?: string;
  t_placement?: string;
  tooltip?: string;
  onChange: (value: any, id: string) => void;
  step?: number;
  type?: 'number' | 'text';
}

export function InputField(props: Props) {
  const {id, label, value, stop = false, placeholder, onChange, testID, step, type = 'number'} = props;

  const invokeValueChange = React.useCallback(
    (value: string | any) => {
      typeof value === 'string'
        ? onChange(step == undefined ? +value : value, id as string)
        : onChange(value?.target.value, id as string);
    },
    [onChange, id, step],
  );

  return (
    <Box>
      <Box color="rgba(255, 255, 255, 0.6)" fontSize="14px" paddingBottom={1}>
        {label}
      </Box>
      {type === 'number' ? (
        <NumberInput
          step={props.step}
          size="sm"
          placeholder={placeholder}
          onChange={invokeValueChange}
          value={value || ''}
        >
          <NumberInputField
            data-testid={testID}
            id={id}
            fontSize={16}
            maxLength={9}
            padding="5px"
            borderRadius={2}
            borderColor={stop ? 'red' : 'rgba(255, 255, 255, 0.6)'}
            backgroundColor="#121212"
            color="rgba(255, 255, 255, 0.87)"
            height="30px"
            _hover={{borderColor: 'rgba(255, 255, 255, 0.6)'}}
            _focus={{borderColor: stop ? 'red' : 'green'}}
          />
        </NumberInput>
      ) : (
        <Input
          data-testid={testID}
          borderColor="rgba(255, 255, 255, 0.6)"
          backgroundColor="#121212"
          _focus={{borderColor: 'green'}}
          height="30px"
          borderRadius={2}
          padding="5px"
          type="password"
          onChange={invokeValueChange}
          value={value || ''}
        />
      )}
    </Box>
  );
}
