"use client";
import "./chat.css";
import {
  Avatar,
  Box,
  Grid,
  IconButton,
  Button,
  Modal,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { makeStyles } from "@mui/styles";
import { useSelector } from "react-redux";
import headerStyle from "@/styles/Header";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import { translate } from "@/config/localisation";
import Textarea from "@/components/Chat/TextArea";
import { useState, useEffect, useRef } from "react";
import CustomizedSnackbars from "@/components/common/Snackbar";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { gruvboxDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import PatchAnnotationAPI from "@/app/actions/api/Dashboard/PatchAnnotations";
import GetTaskAnnotationsAPI from "@/app/actions/api/Dashboard/GetTaskAnnotationsAPI";
import { Block } from "@mui/icons-material";
import ChatLang from "@/utils/Chatlang";

const useStyles = makeStyles((theme) => ({
  tooltip: {
    fontSize: "1rem !important", // Adjust the font size as needed
  },
}));

const codeStyle = {
  borderRadius: "0xp 0px 5px 5px",
  width: "45vw",
  overflowX: "scroll",
  fontSize: "1.1rem",
};

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};

const InstructionDrivenChatPage = ({
  chatHistory,
  setChatHistory,
  handleClick,
  formatResponse,
  formatPrompt,
  id,
  stage,
  notes,
  info,
  disableUpdateButton
}) => {
  /* eslint-disable react-hooks/exhaustive-deps */
  const tooltipStyle = useStyles();
  let inputValue = "";
  const classes = headerStyle();
  const { taskId } = useParams();
  const [annotationId, setAnnotationId] = useState();
  const bottomRef = useRef(null);
  const [hasMounted,setHasMounted] = useState(false);
  const [showChatContainer, setShowChatContainer] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadtime, setloadtime] = useState(new Date());
  const load_time = useRef();
  const [snackbar, setSnackbarInfo] = useState({
    open: false,
    message: "",
    variant: "success",
  });
  const loggedInUserData = useSelector((state) => state.getLoggedInData?.data);
  const handleOpen = () => {
    setOpen(true);
  };
console.log(disableUpdateButton);
  const handleClose = () => {
    setOpen(false);
  };
  


  const renderSnackBar = () => {
    return (
      <CustomizedSnackbars
        open={snackbar.open}
        handleClose={() =>
          setSnackbarInfo({ open: false, message: "", variant: "" })
        }
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        variant={snackbar.variant}
        message={snackbar.message}
      />
    );
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setSnackbarInfo({
        open: true,
        message: "Copied to clipboard!",
        variant: "success",
      });
    } catch (error) {
      setSnackbarInfo({
        open: true,
        message: "Failed to copy to clipboard!",
        variant: "error",
      });
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      const taskAnnotationsObj = new GetTaskAnnotationsAPI(taskId);
      const response = await fetch(taskAnnotationsObj.apiEndPoint(), {
        method: "GET",
        headers: taskAnnotationsObj.getHeaders().headers,
      });
      const data = await response.json();
      let modifiedChatHistory = [];
      if (data && Array.isArray(data[0]?.result) && [...data[0]?.result]?.length) {
        if (stage === "Review") {
          let reviewData = data.find((item) => item.annotation_type === 2);
          if (reviewData.annotation_status === "unreviewed") {
            reviewData = data.find((item) => item.annotation_type === 1);
          }
          modifiedChatHistory = reviewData?.result?.map((interaction) => {
            return {
              ...interaction,
              output: formatResponse(interaction.output),
            };
          });
        }else if(stage=="SuperChecker"){
          let obj = data.filter((data)=>data.annotation_type==3)
          modifiedChatHistory = obj[0]?.result?.map((interaction) => {
            return {
              ...interaction,
              output: formatResponse(interaction.output),
            };
          });
        }else if(stage=="Annotation"){
          let obj = data.filter((data)=>data.annotation_type==1)
          modifiedChatHistory = obj[0]?.result?.map((interaction) => {
            return {
              ...interaction,
              output: formatResponse(interaction.output),
            };
          });
        }
        else{
          modifiedChatHistory = data[0]?.result?.map((interaction) => {
            return {
              ...interaction,
              output: formatResponse(interaction.output),
            };
          });
        }
        setChatHistory([...modifiedChatHistory]);
      } else {
        setChatHistory([]);
      }
      setAnnotationId(data[0]?.id);
      if (data[0]?.result) setShowChatContainer(true);
    };
    fetchData();
  }, [taskId]);

  const cleanMetaInfo = (value) => value.replace(/\(for example:.*?\)/gi, '').trim();

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
  };
  
  const formatTextWithTooltips = (text, info) => {
    // Ensure text is a string
    text = String(text);
  
    // Clean the meta info values
    const metaInfoIntent = cleanMetaInfo(String(info.meta_info_intent));
    const metaInfoLanguage = cleanMetaInfo(String(info.meta_info_language));
    const metaInfoDomain = cleanMetaInfo(String(info.meta_info_domain));
  
    let formattedText = text;
  
    const placeholders = [
      { key: 'meta_info_intent', value: metaInfoIntent, tooltip: 'Intent of the instruction' },
      { key: 'meta_info_language', value: metaInfoLanguage, tooltip: 'Language used' },
      { key: 'meta_info_domain', value: metaInfoDomain, tooltip: 'Domain of the content' }
    ];
  
    placeholders.forEach(({ value, tooltip }) => {
      if (value !== 'None') {
        const escapedValue = escapeRegExp(value);
        const regex = new RegExp(`(${escapedValue})`, 'gi');
        text = text.replace(regex, (match) => {
          return `<Tooltip title="${tooltip}"><strong>${match}</strong></Tooltip>`;
        });
  
      }
    });
  
    return text;
  };
    const formattedText = formatTextWithTooltips(info.instruction_data, info);
  
    const handleButtonClick = async () => {
    if (inputValue) {
      setLoading(true);
      const body = {
        result: inputValue,
        lead_time: (new Date() - loadtime) / 1000 + Number(id?.lead_time?.lead_time ?? 0),
        auto_save: true,
        task_id: taskId,
      };
      console.log(id,stage);
      if(stage==="Alltask"){
        body.annotation_status = id?.annotation_status
      }else{
        body.annotation_status = localStorage.getItem("labellingMode")
      }
      if (stage === "Review") {
        body.review_notes = JSON.stringify(notes?.current?.getEditor().getContents());
      } else if (stage === "SuperChecker") {
        body.superchecker_notes = JSON.stringify(notes?.current?.getEditor().getContents());
      } else {
        body.annotation_notes = JSON.stringify(notes?.current?.getEditor().getContents());
      }
      if (stage === "Review" || stage === "SuperChecker") {
        body.parentannotation = id?.parent_annotation;
      }
      const AnnotationObj = new PatchAnnotationAPI(id?.id, body);
      const res = await fetch(AnnotationObj.apiEndPoint(), {
        method: "PATCH",
        body: JSON.stringify(AnnotationObj.getBody()),
        headers: AnnotationObj.getHeaders().headers,
      });
      const data = await res.json();
      let modifiedChatHistory;
      setChatHistory((prevChatHistory) => {
        data && data.result && setLoading(false);
        if (data && data.result) {
          modifiedChatHistory = data.result.map((interaction) => {
            return {
              ...interaction,
              output: formatResponse(interaction.output),
            };
          });
        } else {
          setSnackbarInfo({
            open: true,
            message: data?.message,
            variant: "error",
          });
        }
        return data && data.result
          ? [...modifiedChatHistory]
          : [...prevChatHistory];
      });
    } else {
      setSnackbarInfo({
        open: true,
        message: "Please provide a prompt",
        variant: "error",
      });
    }
    setTimeout(() => {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
    setShowChatContainer(true);
  };
  const handleOnchange = (prompt) => {
    inputValue = prompt;
  };

  const renderChatHistory = () => {
    const chatElements = [];
    for (let index = 0; index < chatHistory?.length; index++) {
      const message = chatHistory[index];
      chatElements.push(
        <Box
          sx={{
            paddingY: "1.5rem",
          }}
          key={index}
        >
          <Box
            sx={{
              width: "50vw",
              display: "flex",
              flexDirection: "column",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(247, 184, 171, 0.2)",
              position: "relative",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
              }}
            >
              <Avatar
                alt="user_profile_pic"
                variant="contained"
                src={
                  loggedInUserData?.profile_photo
                    ? loggedInUserData.profile_photo
                    : ""
                }
                className={classes.avatar}
                sx={{
                  marginRight: "1rem",
                }}
              />
              <ReactMarkdown className="flex-col">
                {formatPrompt(message.prompt)}
              </ReactMarkdown>
              {index === chatHistory.length - 1 && stage !== "Alltask" && !disableUpdateButton &&(
                <IconButton
                  size="large"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    margin: "0.5rem",
                    borderRadius: "50%",
                  }}
                  onClick={() => {
                    handleClick("delete-pair", id?.id, 0.0);
                  }}
                >
                  <DeleteOutlinedIcon
                    style={{
                      color: "#EE6633",
                      fontSize: "1.2rem",
                    }}
                  />
                </IconButton>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              width: "50vw",
              display: "flex",
              justifyContent: "start",
              alignItems: "start",
              padding: "3.5rem 1.5rem 0rem",
              borderRadius: "0.5rem",
            }}
          >
            <Image
              width={50}
              height={50}
              src="https://i.imgur.com/56Ut9oz.png"
              alt="Bot Avatar"
              style={{
                marginRight: "1rem",
              }}
            />
            <Box className="flex-col">
              {message?.output?.map((segment, index) =>
                segment.type == "text" ? (
                  <ReactMarkdown
                    key={index}
                    className="flex-col overflow-x-scroll"
                  >
                    {segment.value}
                  </ReactMarkdown>
                ) : (
                  <>
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignContent: "center",
                        paddingX: "1rem",
                        borderRadius: "5px 5px 0 0",
                        backgroundColor: "#c5c5c5",
                        paddingY: "0.8rem",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "1rem",
                          color: "#4e4e4e",
                          fontWeight: "500",
                        }}
                      >
                        {segment.language}
                      </p>
                      <Tooltip
                        title="Copy code to clipboard"
                        classes={{ tooltip: tooltipStyle.tooltip }}
                      >
                        <button
                          style={{
                            display: "flex",
                            justifyContent: "end",
                            alignItems: "end",
                          }}
                          onClick={copyToClipboard.bind(null, segment.value)}
                        >
                          <ContentPasteIcon
                            sx={{
                              fontSize: "1.4rem",
                              color: "#4e4e4e",
                            }}
                          />
                          <p
                            style={{
                              paddingLeft: "0.2rem",
                              fontSize: "1rem",
                              color: "#4e4e4e",
                              fontWeight: "500",
                            }}
                          >
                            Copy
                          </p>
                        </button>
                      </Tooltip>
                    </Box>
                    <SyntaxHighlighter
                      language={segment.language}
                      style={gruvboxDark}
                      className="code"
                      customStyle={codeStyle}
                    >
                      {segment.value}
                    </SyntaxHighlighter>
                  </>
                ),
              )}
            </Box>
          </Box>
        </Box>,
      );
    }
    return chatElements;
  };

  const ChildModal = () => {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
      setOpen(true);
    };

    const handleClose = () => {
      setOpen(false);
    };

    return (
      <>
        <Button
          sx={{
            marginTop: "1rem",
          }}
          variant="outlined"
          onClick={handleOpen}
        >
          {translate("modalButton.metaDataInfo")}
        </Button>

        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="child-modal-title"
          aria-describedby="child-modal-description"
        >
          <Box sx={{ ...style, width: "40%" }}>
            <Typography
              id="child-modal-title"
              color={"#F18359"}
              fontWeight={"bold"}
              variant="h6"
            >
              {translate("modal.domain")}
            </Typography>
            <Typography variant="subtitle1" id="child-modal-description">
              {info.meta_info_domain}
            </Typography>

            <Typography
              color={"#F18359"}
              fontWeight={"bold"}
              variant="h6"
              id="child-modal-title"
            >
              {translate("modal.intent")}
            </Typography>
            <Typography variant="subtitle1" id="child-modal-description">
              {info.meta_info_intent}
            </Typography>

            <Typography
              id="child-modal-title"
              color={"#F18359"}
              fontWeight={"bold"}
              variant="h6"
            >
              {translate("modal.language")}
            </Typography>
            <Typography variant="subtitle1" id="child-modal-description">
              {ChatLang[info.meta_info_language]}
            </Typography>

            <Button variant="outlined" onClick={handleClose}>
              {translate("modalButton.close")}
            </Button>
          </Box>
        </Modal>
      </>
    );
  };

  return (
    <>
      {renderSnackBar()}
      <Grid container spacing={2} id="top">
        <Grid item xs={12}>
          <Box
            sx={{
              borderRadius: "20px",
              padding: "10px",
              marginTop: "1.5rem",
              backgroundColor: "rgba(247, 184, 171, 0.2)",
              marginLeft: "1rem",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                
              }}
            >
              <Typography
                variant="h3"
                align="center"
                sx={{
                  color: "#636363",
                  fontSize: "2rem",
                  fontWeight: "800",
                  marginRight: "0.5rem",
                }}
              >
                {translate("typography.instructions")}
              </Typography>


<Tooltip
      title={
        <span style={{ fontFamily: 'Roboto, sans-serif' }}>
          Hint and Metadata
        </span>
      }
    >
      <IconButton onClick={handleOpen}>
        <TipsAndUpdatesIcon color="primary.dark" fontSize="large" />
      </IconButton>
    </Tooltip>
            </Box>

            <Typography
              paragraph={true}
              sx={{
                fontSize: "1.2rem",
                padding: "0.5rem 1rem 0",
                minHeight: "6rem",
                maxHeight: "6rem",
                overflowY: "auto",
                display: "flex",
                // alignItems: "center",
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
             {info.instruction_data}
            </Typography>
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          sx={{
            margin: "0.8rem 0",
            overflowY: "scroll",
            minHeight: "39rem",
            maxHeight: "39rem",
            borderRadius: "20px",
            backgroundColor: "#FFF",
            paddingLeft: "0px !important",
            boxSizing: "border-box",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100% !important",
              padding: "1rem 0 4rem",
            }}
          >
            {showChatContainer ? renderChatHistory() : null}
          </Box>
          <div ref={bottomRef} />
        </Grid>
        {stage!=="Alltask" && !disableUpdateButton ?<Grid item xs={12} sx={{ boxSizing: "border-box" }}>
          <Textarea
            handleButtonClick={handleButtonClick}
            handleOnchange={handleOnchange}
            size={12}
            grid_size={"80.6rem"}
            class_name={""}
            loading={loading}
            inputValue={inputValue}
          />
        </Grid>:null}
      </Grid>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="parent-modal-title"
        aria-describedby="parent-modal-description"
      >
        <Box sx={{ ...style, width: "40%" }}>
          <Typography
            color={"#F18359"}
            fontWeight={"bold"}
            variant="h6"
            id="parent-modal-title"
          >
            {translate("modal.hint")}
          </Typography>
          <Typography variant="subtitle1" id="parent-modal-description">
            {info.hint}
          </Typography>

          <Typography
            color={"#F18359"}
            fontWeight={"bold"}
            variant="h6"
            id="parent-modal-title"
          >
            {translate("modal.examples")}
          </Typography>
          <Typography variant="subtitle1" id="parent-modal-description">
            {info.examples}
          </Typography>

          <ChildModal />
        </Box>
      </Modal>
    </>
  );
};

export default InstructionDrivenChatPage;
