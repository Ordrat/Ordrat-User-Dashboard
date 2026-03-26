import { Input, InputWrapper } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

export function SidebarSearch() {
  const { t } = useTranslation('common');
  const handleInputChange = () => {};

  return (
    <div className="flex px-5 pt-2.5 shrink-0">
      <InputWrapper className="relative">
        <Input type="search" placeholder={t('actions.search')} onChange={handleInputChange} />
        <Badge className="absolute end-3 gap-1" variant="outline" size="sm">⌘ K</Badge>
      </InputWrapper>
    </div>
  );
}
