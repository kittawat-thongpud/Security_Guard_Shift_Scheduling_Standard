import React from 'react';
import {
  Paper,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  OpenWith as MoveIcon,
  SwapHoriz as SwapIcon,
  Schedule as OvertimeIcon,
  LocationOn as LocationIcon,
  Visibility as ViewIcon,
  FileCopy as DuplicateIcon,
} from '@mui/icons-material';
import type { ContextMenuAction, Shift } from '../../types';
import { usePatternStore } from '../../stores/patternStore';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  targetShift?: Shift;
  availableActions: ContextMenuAction[];
  onAction: (action: ContextMenuAction) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  targetShift,
  availableActions,
  onAction,
}) => {
  const { executeContextAction } = usePatternStore();

  if (!isOpen) return null;

  const handleAction = (action: ContextMenuAction) => {
    onAction(action);
    executeContextAction(action);
  };

  const getActionIcon = (action: ContextMenuAction) => {
    switch (action) {
      case 'edit':
        return <EditIcon fontSize="small" />;
      case 'delete':
        return <DeleteIcon fontSize="small" />;
      case 'copy':
        return <CopyIcon fontSize="small" />;
      case 'move':
        return <MoveIcon fontSize="small" />;
      case 'swap':
        return <SwapIcon fontSize="small" />;
      case 'convert-overtime':
        return <OvertimeIcon fontSize="small" />;
      case 'assign-location':
        return <LocationIcon fontSize="small" />;
      case 'view-details':
        return <ViewIcon fontSize="small" />;
      case 'duplicate':
        return <DuplicateIcon fontSize="small" />;
      default:
        return <EditIcon fontSize="small" />;
    }
  };

  const getActionLabel = (action: ContextMenuAction) => {
    switch (action) {
      case 'edit':
        return 'Edit Shift';
      case 'delete':
        return 'Delete Shift';
      case 'copy':
        return 'Copy Shift';
      case 'move':
        return 'Move Shift';
      case 'swap':
        return 'Swap with Another';
      case 'convert-overtime':
        return 'Convert to Overtime';
      case 'assign-location':
        return 'Assign Location';
      case 'view-details':
        return 'View Details';
      case 'duplicate':
        return 'Duplicate Shift';
      default:
        return action;
    }
  };

  const getActionColor = (action: ContextMenuAction): 'error' | 'primary' | 'default' => {
    if (action === 'delete') return 'error';
    if (action === 'edit' || action === 'view-details') return 'primary';
    return 'default';
  };

  // Group actions for better organization
  const basicActions: ContextMenuAction[] = ['edit', 'view-details', 'duplicate'];
  const modifyActions: ContextMenuAction[] = ['copy', 'move', 'swap'];
  const specialActions: ContextMenuAction[] = ['convert-overtime', 'assign-location'];
  const destructiveActions: ContextMenuAction[] = ['delete'];

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 1300,
        minWidth: 200,
        boxShadow: 3,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Shift Info Header */}
      {targetShift && (
        <>
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {targetShift.type.charAt(0).toUpperCase() + targetShift.type.slice(1)} Shift
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {targetShift.date} | {targetShift.startTime} - {targetShift.endTime}
            </Typography>
            {targetShift.isOvertime && (
              <Typography variant="caption" color="error" fontWeight="bold">
                OVERTIME
              </Typography>
            )}
          </Paper>
          <Divider />
        </>
      )}

      <MenuList dense>
        {/* Basic Actions */}
        {basicActions
          .filter(action => availableActions.includes(action))
          .map((action) => (
            <MenuItem
              key={action}
              onClick={() => handleAction(action)}
              sx={{
                color: getActionColor(action) === 'primary' ? 'primary.main' : 'text.primary',
              }}
            >
              <ListItemIcon>
                {getActionIcon(action)}
              </ListItemIcon>
              <ListItemText>{getActionLabel(action)}</ListItemText>
            </MenuItem>
          ))}

        {modifyActions.some(action => availableActions.includes(action)) && <Divider />}

        {/* Modify Actions */}
        {modifyActions
          .filter(action => availableActions.includes(action))
          .map((action) => (
            <MenuItem
              key={action}
              onClick={() => handleAction(action)}
            >
              <ListItemIcon>
                {getActionIcon(action)}
              </ListItemIcon>
              <ListItemText>{getActionLabel(action)}</ListItemText>
            </MenuItem>
          ))}

        {specialActions.some(action => availableActions.includes(action)) && <Divider />}

        {/* Special Actions */}
        {specialActions
          .filter(action => availableActions.includes(action))
          .map((action) => (
            <MenuItem
              key={action}
              onClick={() => handleAction(action)}
              sx={{
                color: action === 'convert-overtime' ? 'warning.main' : 'primary.main',
              }}
            >
              <ListItemIcon>
                {getActionIcon(action)}
              </ListItemIcon>
              <ListItemText>{getActionLabel(action)}</ListItemText>
            </MenuItem>
          ))}

        {destructiveActions.some(action => availableActions.includes(action)) && <Divider />}

        {/* Destructive Actions */}
        {destructiveActions
          .filter(action => availableActions.includes(action))
          .map((action) => (
            <MenuItem
              key={action}
              onClick={() => handleAction(action)}
              sx={{
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'error.contrastText',
                },
              }}
            >
              <ListItemIcon>
                {getActionIcon(action)}
              </ListItemIcon>
              <ListItemText>{getActionLabel(action)}</ListItemText>
            </MenuItem>
          ))}
      </MenuList>

      {/* Keyboard Shortcuts Info */}
      <Paper sx={{ p: 1, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="textSecondary">
          Right-click anywhere to close
        </Typography>
      </Paper>
    </Paper>
  );
};

export default ContextMenu;