import {Link} from 'react-router-dom'
import React from "react";
import Drawer from "@material-ui/core/Drawer";
import MenuIcon from '@material-ui/icons/Menu';
import PersonIcon from '@material-ui/icons/Person';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import {useI18n} from "@i18n-chain/react";
import i18n from "../constant/i18n";
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Switch from "@material-ui/core/Switch"
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import createStyles from "@material-ui/core/styles/createStyles";
import {Theme} from '@material-ui/core/styles';
import withStyles from "@material-ui/core/styles/withStyles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import {loadPlayerName, savePlayerName} from "../api/localStorage";

import './drawer-app-bar.css';

const MUIDrawer = Drawer;


const AntSwitch = withStyles((theme: Theme) =>
    createStyles({
        root: {
            width: 28,
            height: 16,
            padding: 0,
            display: 'flex',
        },
        switchBase: {
            padding: 2,
            color: theme.palette.grey[500],
            '&$checked': {
                transform: 'translateX(12px)',
                color: theme.palette.common.white,
                '& + $track': {
                    opacity: 1,
                    backgroundColor: theme.palette.primary.main,
                    borderColor: theme.palette.primary.main,
                },
            },
        },
        thumb: {
            width: 12,
            height: 12,
            boxShadow: 'none',
        },
        track: {
            border: `1px solid ${theme.palette.grey[500]}`,
            borderRadius: 16 / 2,
            opacity: 1,
            backgroundColor: theme.palette.common.white,
        },
        checked: {},
    }),
)(Switch);

const DrawerAppBar = () => {

    useI18n(i18n);
    const [open, setOpen] = React.useState(false);
    const [checked, setChecked] = React.useState(false);
    const [playerName, setPlayerName] = React.useState(loadPlayerName() || "");
    const [nameEdited, setNameEdited] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const switchChecked = event.target.checked;
        if(switchChecked){
            i18n._.locale("en").then(()=>{});
        }else {
            i18n._.locale("zh_CN").then(()=>{});
        }
        setChecked(event.target.checked);
    };
    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPlayerName(event.target.value);
        setNameEdited(true);
    };
    const handleNameBlur = () => {
        if (nameEdited) {
            savePlayerName(playerName);
            setNameEdited(false);
        }
    };
    const handleNameKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter") {
            savePlayerName(playerName);
            setNameEdited(false);
            (event.target as HTMLInputElement).blur();
        }
    };
    return <React.Fragment>
        <AppBar position={"sticky"} className="dybn-app-bar">
        <Toolbar>
            <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleOpen}
                edge="start"
            >
                <MenuIcon/>
            </IconButton>
            <Typography component="div">
                <Grid component="label" container alignItems="center" spacing={1}>
                    <Grid item>中文</Grid>
                    <Grid item>
                        <AntSwitch checked={checked} onChange={handleChange} name="locale-switch" />
                    </Grid>
                    <Grid item>English</Grid>
                </Grid>
            </Typography>
            <TextField
                value={playerName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                placeholder={i18n.drawer.playerNamePlaceholder}
                size="small"
                inputProps={{ maxLength: 7 }}
                InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                        <InputAdornment position="start" style={{ marginRight: 2 }}>
                            <PersonIcon fontSize="small" />
                            <ChevronRightIcon fontSize="small" />
                        </InputAdornment>
                    ),
                    style: { color: '#fff' },
                }}
                style={{ marginLeft: 'auto', marginRight: 4, maxWidth: 200 }}
            />
        </Toolbar>
    </AppBar>
        <MUIDrawer open={open} anchor={"left"} onClose={handleClose}>
            <List>
                <ListItem><Button><Link to={'/'}>{i18n.drawer.lobby}</Link></Button></ListItem>
                <ListItem><Button><Link to={'/cards'}>{i18n.drawer.cards}</Link></Button></ListItem>
                <ListItem><Button><Link to={'/match-stats'}>对局数据</Link></Button></ListItem>
                <ListItem><Button><Link to={'/local4p'}>{i18n.drawer.fourPlayer}</Link></Button></ListItem>
                <ListItem><Button><Link to={'/about'}>{i18n.drawer.about}</Link></Button></ListItem>
            </List>
        </MUIDrawer>
    </React.Fragment>
}

export default DrawerAppBar;
