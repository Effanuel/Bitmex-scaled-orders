import React from 'react';
import {Table, Tbody, Td, Th, Thead, Tr} from '@chakra-ui/react';
import {formatPrice} from 'general/formatting';
import {PREVIEW_CONTAINER} from 'data-test-ids';
import {SYMBOL} from 'redux/api/bitmex/types';
import {useSelector} from 'react-redux';
import {ordersAverageEntrySelector, ordersRiskPercSelector, ordersRiskSelector} from 'redux/selectors';

interface Props {
  symbol: SYMBOL;
}

export default function DetailsTable({symbol}: Props) {
  const averagePrice = useSelector(ordersAverageEntrySelector);
  const riskBTC = useSelector(ordersRiskSelector);
  const riskPerc = useSelector(ordersRiskPercSelector);

  const renderPriceSection = React.useMemo(() => {
    return (
      <Tr>
        <Td>Average entry</Td>
        <Td isNumeric>
          {formatPrice(averagePrice || null, symbol)}
          <span style={{color: '#4caf50'}}> USD</span>
        </Td>
      </Tr>
    );
  }, [averagePrice, symbol]);

  const renderRiskSection = React.useMemo(() => {
    return riskBTC ? (
      <>
        <Tr>
          <Td>Risk</Td>
          <Td isNumeric>
            {riskBTC}
            <span style={{color: '#4caf50'}}> BTC</span>
          </Td>
        </Tr>
        {riskPerc !== 0 && (
          <Tr data-testid={PREVIEW_CONTAINER.RISK_PERC_ROW}>
            <Td>Risk(%)</Td>
            <Td isNumeric>
              {riskPerc}
              <span style={{color: '#4caf50'}}> %</span>
            </Td>
          </Tr>
        )}
      </>
    ) : null;
  }, [riskBTC, riskPerc]);

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Details</Th>
          <Th isNumeric>Price</Th>
        </Tr>
      </Thead>
      <Tbody>
        {renderPriceSection}
        {renderRiskSection}
      </Tbody>
    </Table>
  );
}
