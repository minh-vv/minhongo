import PublicContentPage from '../components/PublicContentPage';

export default function KanjiPage() {
  return (
    <PublicContentPage
      title="Chữ Hán"
      subtitle="Luyện tập chữ Hán theo các cấp độ JLPT."
      category="HANTU"
      accentColor="var(--primary)"
      ghostChar="漢"
    />
  );
}
