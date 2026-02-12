import { Button } from "../../../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui//popover"

const Example = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline">Действия</Button>
    </PopoverTrigger>
    <PopoverContent>
      <div className="space-y-2">
        <Button className="w-full">Изменить</Button>
        <Button className="w-full" variant="outline">
          Поделиться
        </Button>
        <Button className="w-full" variant="destructive">
          Удалить
        </Button>
      </div>
    </PopoverContent>
  </Popover>
)

export default Example
