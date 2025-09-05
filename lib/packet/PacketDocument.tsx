import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { PacketProject, PacketMedia } from './types';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e40af',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 120,
    color: '#6b7280',
  },
  value: {
    fontSize: 12,
    flex: 1,
    color: '#111827',
  },
  description: {
    fontSize: 11,
    lineHeight: 1.4,
    color: '#374151',
    backgroundColor: '#f9fafb',
    padding: 10,
    marginTop: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  photoContainer: {
    width: '48%',
    marginBottom: 10,
    marginRight: '2%',
  },
  photo: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    borderRadius: 4,
  },
  photoCaption: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 10,
  },
});

interface PacketDocumentProps {
  project: PacketProject;
  media: PacketMedia[];
}

export function PacketDocument({ project, media }: PacketDocumentProps) {
  const photos = media.filter(m => m.type === 'photo');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Insurance Claim Documentation</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claim Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Claim ID:</Text>
            <Text style={styles.value}>{project.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date Filed:</Text>
            <Text style={styles.value}>{new Date(project.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Incident Date:</Text>
            <Text style={styles.value}>{new Date(project.incident_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Peril Type:</Text>
            <Text style={styles.value}>{project.peril.charAt(0).toUpperCase() + project.peril.slice(1)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Owner</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{project.contact_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{project.contact_phone}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{project.contact_email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Address</Text>
          <Text style={styles.value}>
            {project.address}, {project.city}, {project.state} {project.zip}
          </Text>
        </View>

        {project.carrier_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insurance Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Carrier:</Text>
              <Text style={styles.value}>{project.carrier_name}</Text>
            </View>
            {project.policy_number && (
              <View style={styles.row}>
                <Text style={styles.label}>Policy:</Text>
                <Text style={styles.value}>{project.policy_number}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Description</Text>
          <Text style={styles.description}>{project.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inspection Schedule</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Preferred Date:</Text>
            <Text style={styles.value}>{new Date(project.preferred_date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Time Window:</Text>
            <Text style={styles.value}>{project.preferred_window}</Text>
          </View>
        </View>

        {photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Documentation ({photos.length} Photos)</Text>
            <View style={styles.photoGrid}>
              {photos.slice(0, 6).map((photo, index) => (
                <View key={photo.id} style={styles.photoContainer}>
                  <Image style={styles.photo} src={photo.signed_url} />
                  {photo.room_tag && (
                    <Text style={styles.photoCaption}>
                      {photo.room_tag}{photo.caption ? ` - ${photo.caption}` : ''}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Generated by DisasterShield • {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
}