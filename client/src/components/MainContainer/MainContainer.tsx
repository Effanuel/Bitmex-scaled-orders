import React from 'react';
import {Flex, Container, Box, Collapse, Tooltip} from '@chakra-ui/react';
import {InfoOutlineIcon, WarningTwoIcon} from '@chakra-ui/icons';
import styles from './styles.module.scss';
import {MAIN_CONTAINER} from '../../data-test-ids';

interface Props {
  children: React.ReactNode | React.ReactNode[];
  label: string;
  description?: string;
  renderOutside?: React.ReactNode;
  connected?: boolean;
  secondaryState?: React.ReactNode;
}

export const MainContainer = React.memo((props: Props) => {
  const {children, label, description = '', renderOutside = null, connected = true, secondaryState} = props;

  const [isViewMaximized, setViewMaximized] = React.useState<boolean>(true);

  const maximizeContainer = React.useCallback(() => setViewMaximized(!isViewMaximized), [isViewMaximized]);

  return (
    <div className={!connected ? styles.dim : undefined}>
      <Container data-testid={label} className={styles.container_scaled} p={0} maxW="720px">
        <Flex w="100%" className={styles.container__row__minimized}>
          <Flex className={styles.div_corner} key={label}>
            <Flex
              data-testid={MAIN_CONTAINER.CORNER_BUTTON}
              className={styles.div_corner__button}
              onClick={maximizeContainer}
            />
          </Flex>
          <div className={styles.container_minimized_text}>
            <span>{label}</span>
            <Box>
              {!connected && (
                <Tooltip marginRight={2} hasArrow label={'Not connected to a websocket'} bg="gray.300" color="black">
                  <WarningTwoIcon color="grey" marginRight={2} />
                </Tooltip>
              )}
              <Tooltip marginRight={2} hasArrow label={description} bg="gray.300" color="black">
                <InfoOutlineIcon color="grey" marginRight={2} />
              </Tooltip>
            </Box>
          </div>
        </Flex>
        <Collapse className={styles.main} in={isViewMaximized} animateOpacity unmountOnExit>
          <Box data-testid={MAIN_CONTAINER.CHILDREN_VIEW}>{secondaryState ?? children}</Box>
        </Collapse>
      </Container>

      {isViewMaximized && !!renderOutside ? <>{renderOutside}</> : null}
    </div>
  );
});
