import { useState, useEffect } from "react";
import { Table, Tag, Button, Card, message, Popconfirm, Modal, Typography, Spin } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const DELETE_ENDPOINTS = {
  VENUE: "/api/venues",
  CATERING: "/api/catering",
  PHOTOGRAPHER: "/api/photographers",
  DESIGNER: "/api/designers",
};

const ProviderDashboard = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingServices();
  }, [currentUser]);

  const fetchPendingServices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/providers/services");
      const pending = response.data.filter(
        (svc) =>
          svc.status &&
          svc.status.toUpperCase() !== "APPROVED" &&
          (!svc.providerId || svc.providerId === currentUser.id)
      );
      setServices(pending);
    } catch (error) {
      message.error("Failed to load pending services");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, category) => {
    try {
      const endpoint = DELETE_ENDPOINTS[category];
      if (!endpoint) {
        throw new Error("Invalid service type");
      }
      await api.delete(`${endpoint}/${id}`);
      message.success("Service deleted successfully");
      fetchPendingServices();
    } catch (error) {
      message.error("Failed to delete service");
    }
  };

  const handleEdit = (id, serviceType) => {
    navigate("/provider/register-service", {
      state: { serviceId: id, serviceType },
    });
  };

  const showServiceDetails = (service) => {
    setSelectedService(service);
    setDetailModalVisible(true);
  };

  const getStatusTag = (status) => {
    let color = "";
    switch (status) {
      case "PENDING":
        color = "gold";
        break;
      case "APPROVED":
        color = "green";
        break;
      case "REJECTED":
        color = "red";
        break;
      default:
        color = "default";
    }
    return <Tag color={color}>{status}</Tag>;
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button icon={<EyeOutlined />} onClick={() => showServiceDetails(record)} />
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id, record.category)}
            disabled={record.status === "APPROVED"}
          />
          <Popconfirm
            title="Are you sure you want to delete this service?"
            onConfirm={() => handleDelete(record.id, record.category)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const renderServiceDetails = () => {
    if (!selectedService) return null;
    const { category } = selectedService;
    return (
      <div>
        <Title level={4}>{selectedService.name}</Title>
        <p>
          <strong>Status:</strong> {getStatusTag(selectedService.status)}
        </p>
        {selectedService.status === "REJECTED" && (
          <p>
            <strong>Rejection Reason:</strong> {selectedService.rejectionReason || "No reason provided"}
          </p>
        )}
        <p>
          <strong>Description:</strong> {selectedService.description}
        </p>
        <p>
          <strong>Location:</strong> {selectedService.location}
        </p>
        {category === "VENUE" && (
          <>
            <p>
              <strong>Capacity:</strong> {selectedService.capacity} people
            </p>
            <p>
              <strong>Price:</strong> ₱{selectedService.price}
            </p>
            <p>
              <strong>Amenities:</strong>{" "}
              {(() => {
                try {
                  const amenities = JSON.parse(selectedService.amenities || "[]");
                  return Array.isArray(amenities) ? amenities.join(", ") : selectedService.amenities || "None";
                } catch {
                  return selectedService.amenities || "None";
                }
              })()}
            </p>
          </>
        )}
        {category === "CATERING" && (
          <>
            <p>
              <strong>Maximum People:</strong> {selectedService.maxPeople} people
            </p>
            <p>
              <strong>Price Per Person:</strong> ₱{selectedService.pricePerPerson}
            </p>
            <p>
              <strong>Cuisine Type:</strong> {selectedService.cuisineType || "None"}
            </p>
          </>
        )}
        {category === "PHOTOGRAPHER" && (
          <>
            <p>
              <strong>Style:</strong> {selectedService.style}
            </p>
            <p>
              <strong>Price Range:</strong> {selectedService.priceRange}
            </p>
            <p>
              <strong>Experience:</strong> {selectedService.experienceYears} years
            </p>
          </>
        )}
        {category === "DESIGNER" && (
          <>
            <p>
              <strong>Style:</strong> {selectedService.style}
            </p>
            <p>
              <strong>Price Range:</strong> {selectedService.priceRange}
            </p>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="pending-services-container" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          My Pending/Rejected Services
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/provider/register-service")}>
          Add New Service
        </Button>
      </div>
      <p>
        Manage all your registered services here. Services need to be approved by admin before they become visible to
        clients.
      </p>
      <Card>
        <Table dataSource={services} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
      <Modal
        title="Service Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {renderServiceDetails()}
      </Modal>
    </div>
  );
};

export default ProviderDashboard;
