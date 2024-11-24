import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import UpdateForm from './UpdateForm';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openUpdateForm, setOpenUpdateForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`/api/projects/${id}`);
        setProject(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch project details');
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/projects/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  const handleUpdateSubmit = async (updateData) => {
    try {
      const res = await axios.post(`/api/projects/${id}/updates`, updateData);
      setProject({
        ...project,
        updates: [...project.updates, res.data],
      });
      setOpenUpdateForm(false);
    } catch (err) {
      setError('Failed to add update');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Container>
        <Typography color="error">Project not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4">{project.name}</Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/projects/${id}/edit`)}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setOpenDeleteDialog(true)}
              >
                Delete
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* Project Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Details
            </Typography>
            <Typography paragraph>{project.description}</Typography>
            <Box display="flex" gap={1} mb={2}>
              <Chip label={project.status} color="primary" />
              <Chip label={`Due: ${new Date(project.dueDate).toLocaleDateString()}`} />
            </Box>
            <Divider sx={{ my: 2 }} />
            
            {/* Project Updates */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Updates</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setOpenUpdateForm(true)}
              >
                Add Update
              </Button>
            </Box>
            <List>
              {project.updates.map((update) => (
                <ListItem key={update._id} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>{update.author.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={update.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {update.content}
                        </Typography>
                        {` — ${new Date(update.createdAt).toLocaleString()}`}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Team Members */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Team Members
            </Typography>
            <List>
              {project.members.map((member) => (
                <ListItem key={member._id}>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={member.email}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Update Form Dialog */}
      <Dialog open={openUpdateForm} onClose={() => setOpenUpdateForm(false)} maxWidth="sm" fullWidth>
        <UpdateForm
          projectId={id}
          onSubmit={handleUpdateSubmit}
          onCancel={() => setOpenUpdateForm(false)}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this project?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectDetails;
