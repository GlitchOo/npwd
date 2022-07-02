import React from 'react';
import { ListItemIcon, ListItemText, Slide, Paper } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { List } from './List';
import { ListItem } from './ListItem';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles((theme) => ({
  root: {
    borderTop: '1px solid',
    borderColor: theme.palette.primary.main,
    width: '100%',
    minHeight: '10%',
    maxHeight: '100%',
    zIndex: 2,
    overflow: 'auto',
  },
}));

export interface IContextMenuOption {
  onClick(e, option): void;
  label: string;
  description?: string;
  selected?: boolean;
  icon?: React.ReactNode;
  key?: string;
  hide?: boolean;
}

interface ContextMenuProps {
  open: boolean;
  onClose: () => void;
  options: Array<IContextMenuOption>;
  marginBottom?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  open,
  onClose,
  options,
  marginBottom,
}) => {
  const classes = useStyles();
  const [t] = useTranslation();

  const _options = onClose
    ? [
        ...options,
        {
          label: t('GENERIC.CLOSE'),
          onClick: onClose,
        } as IContextMenuOption,
      ]
    : options;

  return (
    <Slide
      direction="up"
      in={open}
      style={{
        position: 'absolute',
        bottom: marginBottom ? 16 : 0,
      }}
      mountOnEnter
      unmountOnExit
    >
      <Paper square className={classes.root}>
        <List disablePadding>
          {_options.map((option) => {
            if (option.hide) {
              return null;
            }

            return (
              <ListItem
                selected={option.selected}
                key={option.key || option.label}
                button
                onClick={(e) => {
                  option.onClick(e, option);
                  onClose();
                }}
              >
                {option.icon && <ListItemIcon>{option.icon}</ListItemIcon>}
                <ListItemText primary={option.label} secondary={option.description} />
              </ListItem>
            );
          })}
        </List>
      </Paper>
    </Slide>
  );
};
