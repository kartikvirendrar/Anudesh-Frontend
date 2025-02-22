
import {
  Autocomplete,
  Button,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Stack,
  Input,
  InputAdornment
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import CustomButton from "../common/Button";
import  "../../styles/Dataset.css";
import { useState } from "react";
import userRole from "@/utils/UserMappedByRole/Roles";
const InviteUsersDialog = ({
  handleDialogClose,
  isOpen,
  selectedUsers,
  setSelectedUsers,
  userType,
  setUserType,
  addBtnClickHandler,
  selectedEmails,
  csvFile,
  setSelectedEmails,
  setCsvFile,
  loading,
  btn,
  setbtn,
  value,
  setvalue
}) => {


  
  
/* eslint-disable react-hooks/exhaustive-deps */


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCsvFile(file);
      parseCSV(file);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const emails = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "" && line.includes('@'));
      setSelectedEmails(emails);
      setSelectedUsers(emails)
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (event) => {
    if (btn == null) {
      setSelectedUsers(event.target.value.split(','));
      setSelectedEmails(event.target.value.split(','))
    }
  };

  const dialogCloseHandler = () => {
    handleDialogClose();
    setSelectedUsers([]);
    setSelectedEmails([]);
    setCsvFile(null);
    setbtn(null)
  };
  
  return (
    <Dialog open={isOpen} onClose={dialogCloseHandler} close>
      <DialogTitle style={{ paddingBottom: 0 }}>Invite users to organization</DialogTitle>
      <DialogContent >
        <Stack direction="row">
          {btn?<Autocomplete
                fullWidth
                multiple
                id="tags-filled"
                options={[]}
                freeSolo
                value={selectedUsers}
                onChange={(e, newVal) => setSelectedUsers(newVal)}
                renderTags={(value, getTagProps) =>
                value?.map((option, index) => (
                    <Chip
                    key={index}
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    />
                ))
                }
                sx={{mt: 3, mb: 3}}
            renderInput={(values) => (
              <TextField
                {...values}
                fullwidth
                variant="outlined"
                onChange={handleFileSelect}
                label="Enter email ids of users to invite"
                placeholder="Email ids"
                defaultValue=" "
                value={selectedEmails.join(",")}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: '0.93rem', 
                  },
                  minWidth: "350px",
                  maxWidth: "450px"
                  
                }}
               
              />
            )
            }
          /> :
              <Autocomplete
                fullWidth
                multiple
                id="tags-filled"
                options={[]}
                freeSolo
                value={selectedUsers}
                onChange={(e, newVal) => setSelectedUsers(newVal)}
                renderTags={(value, getTagProps) =>
                value?.map((option, index) => (
                    <Chip
                    key={index}
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    />
                ))
                }
                sx={{mt: 3, mb: 3}}
                
                renderInput={(params) => (
                  <TextField
                      {...params}
                      variant="outlined"
                      label="Enter email ids of users to invite"
                      placeholder="Email ids"
                      sx={{
                        '& .MuiInputLabel-root': {
                          fontSize: '0.93rem', 
                          zIndex: 100,
                        },
                        minWidth: "350px",
                        maxWidth: "450px"
                        
                      }}

                      // InputProps={{readOnly: true}}
                  />
                  )}
              />
           }
          <label htmlFor="upload-csv">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="upload-csv"
            />
            <Button variant="contained"
              color="primary" sx={{ mt: 4 ,ml:1,borderRadius:0}}
              fullwidth
              component="span"
              onClick={() => { setbtn(true) }}
            >
              <AddIcon />
            </Button>
          </label>

        </Stack>
        <FormControl
          variant="outlined"
          fullwidth
          sx={{ width: "100%" }}
        >
          <InputLabel id="role-label">Select user role</InputLabel>
          <Select
            labelId="role-label"
            id="role-select"
            fullWidth
            variant="outlined"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            label="Select user role"
          >
            {Object.keys(userRole).map((el) => (
              <MenuItem key={el} value={el}>
                {el}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions style={{ padding: 24 }}>
        <Button onClick={dialogCloseHandler} size="small">
          Cancel
        </Button>
        <CustomButton
          startIcon={
            !loading ? (
              <AddIcon />
            ) : (
              <CircularProgress size="0.8rem" color="secondary" />
            )
          }
          onClick={addBtnClickHandler}
          size="small"
          label="Add"
          disabled={loading || selectedUsers === null || selectedUsers?.length === 0?true:false}
        />
      </DialogActions>
    </Dialog >
  );
}

export default InviteUsersDialog;